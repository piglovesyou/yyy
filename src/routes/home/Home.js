/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import gql from 'graphql-tag';
import React from 'react';
import {ApolloConsumer, Query} from 'react-apollo';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Home.css';
import ddMenuStyle from 'react-dd-menu/dist/react-dd-menu.css';
import Link from '../../components/Link';
import history from '../../history';
import {parse as qsParse, stringify as qsStringify} from 'querystring';
import SearchBox from '../../components/SearchBox';

import {ContextConsumer} from '../../components/ContextProvider';
import Ratio from '../ratio/Ratio'

import DropdownMenu from 'react-dd-menu';

// import SearchBox from '../../components/SearchBox';

const searchOffset = '?'.length;


class UserIconMenu extends React.Component<{|
  className?: string,
  imageURL: string,
|}> {
  constructor() {
    super();
    this.state = {
      isMenuOpen: false
    };
    this.click = this.click.bind(this);
    this.toggle = this.toggle.bind(this);
    this.close = this.close.bind(this);
  }

  toggle() {
    this.setState({isMenuOpen: !this.state.isMenuOpen});
  }

  close() {
    this.setState({isMenuOpen: false});
  }

  click() {
    console.log('You clicked an item');
  }

  render() {
    const menuOptions = {
      isOpen: this.state.isMenuOpen,
      close: this.close,
      toggle: <img className={this.props.className}
                   src={this.props.imageURL}
                   onClick={this.toggle}
                   onKeyDown={this.toggle}
                   tabIndex={0}
      />,
      animate: false,
      align: 'left',
    };
    return (
      <DropdownMenu {...menuOptions}>
        <li><Link to={'/archived'}>Archived items</Link></li>
        <li><Link to={'/about'}>What is YYYY</Link></li>
        <li><a href="/logout">Logout</a></li>
      </DropdownMenu>
    );
  }
}

class Home extends React.Component<{|
  q: string,
  cursor?: number,
  cursorBackward?: number,
|}> {
  constructor(props) {
    super(props);

    this.state = {
      archivingItems: {},
    };
  }

  render() {
    return (
      <div className={s.root}>
        <Ratio/>
        <Query query={gql`
              query(
                $query: String!,
                $cursor: Int,
                $cursorBackward: Int,
                $count: Int,
              ) {
                getAucItemList(
                  query: $query,
                  cursor: $cursor,
                  cursorBackward: $cursorBackward,
                  count: $count,
                ) {
                  totalCount
                  nextCursor
                  prevCursor
                  items {
                    id
                    imgSrc
                    imgWidth
                    imgHeight
                    itemURL
                  }
                }
              }
            `}
               variables={{
                 query: this.props.q,
                 cursor: this.props.cursor,
                 cursorBackward: this.props.cursorBackward,
                 count: 4,
               }}
        >
          {({
              loading, error, data,
            }) => {
            if (error) return <div>boom!!!</div>;
            const aucItemList =
              loading
                ? !this.props.q
                ? {
                  totalCount: 0,
                  items: [],
                }
                : {
                  totalCount: (
                    <span
                      style={{width: '4em'}}
                      className={s.loadingPlaceholder}
                    >
                        &nbsp;
                      </span>
                  ),
                  items: Array.from(Array(3)).map((_, i) => (
                    <span
                      style={{
                        width: 400,
                        maxWidth: '100%',
                        height: 300,
                        margin: '0 0.5em 0.5em 0',
                      }}
                      key={i}
                      className={s.loadingPlaceholder}
                    >
                        &nbsp;
                      </span>
                  )),
                }
                : data.getAucItemList;
            const {totalCount, items, nextCursor, prevCursor} = aucItemList;
            const enablePrev = typeof prevCursor === 'number' && prevCursor >= 0;
            const enableNext = typeof nextCursor === 'number' && nextCursor >= 0;
            const archivingItemLength = Object.keys(this.state.archivingItems).length;
            return (
              <div>
                <ApolloConsumer>
                  {apolloClient => (
                    <ContextConsumer>
                      {context => {
                        return (
                          <div className={s.toolbar}>
                            {
                              <button onClick={enablePrev ? (() => {
                                const qs = {
                                  ...qsParse(global.location.search.slice(searchOffset)),
                                  // Collect items backward!
                                  cb: prevCursor,
                                };
                                delete qs.c;
                                history.push({pathname: global.location.pathname, search: qsStringify(qs),});
                              }) : null}
                                      disabled={!enablePrev || loading}
                              >Prev</button>
                            }
                            <div className={s.flexSpacer}></div>
                            <Link className={s.brand} to="/" tabIndex={0}>
                              YYYY
                            </Link>
                            {context.pathname === '/' && <SearchBox className={s.searchBox}
                                                                    q={context.query.q}/>}
                            {context.profile
                              ? <UserIconMenu className={s.userIconImg} imageURL={context.profile.image}/>
                              : <a className={s.loginLinkText} href={'/login/twitter'}>Login</a>}
                            <div className={s.flexSpacer}></div>
                            {
                              <button onClick={enableNext ? (() => {
                                if (archivingItemLength > 0) {
                                  apolloClient.mutate({
                                    mutation: gql`
                                      mutation archiveItems($itemIds: [String!]) {
                                        archiveAucItems(itemIds: $itemIds) {
                                          results
                                        }
                                      }
                                    `,
                                    variables: {
                                      itemIds: Object.keys(this.state.archivingItems),
                                    },
                                  });
                                  this.setState({
                                    archivingItems: {},
                                  });
                                }
                                const qs = ({
                                  ...qsParse(global.location.search.slice(searchOffset)),
                                  c: nextCursor,
                                });
                                delete qs.cb;
                                history.push({pathname: global.location.pathname, search: qsStringify(qs),});
                              }) : null}
                                      disabled={!enableNext || loading}
                              >{archivingItemLength > 0
                                ? `Archive ${archivingItemLength} item${archivingItemLength === 1 ? '' : 's'} and ` : ''
                              }Next</button>
                            }
                          </div>
                        );
                      }}
                    </ContextConsumer>
                  )}

                </ApolloConsumer>
                {items.map((item, i) =>
                  (item.props ? (
                    item
                  ) : (
                    <div key={i}
                         className={`${s.aucItem} ${this.state.archivingItems[item.id] ? s.aucItemArchiving : ''}`}
                         onClick={() => {
                           const archivingItems = {...this.state.archivingItems};
                           if (archivingItems[item.id]) {
                             delete archivingItems[item.id];
                           } else {
                             archivingItems[item.id] = true;
                           }
                           this.setState({archivingItems});
                         }}
                    >
                      <img className={s.aucItemImg} src={item.imgSrc}/>
                      <Link to={`/detail/${item.id}`}>{item.title}</Link>
                    </div>
                  )))}
              </div>
            );
          }}
        </Query>

      </div>
    );
  }
}

export default withStyles(s, ddMenuStyle)(Home);
