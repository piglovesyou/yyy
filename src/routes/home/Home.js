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
import ReactList from 'react-list';
import {ApolloConsumer, Query} from 'react-apollo';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Home.css';
import ddMenuStyle from 'react-dd-menu/dist/react-dd-menu.css';
import Link from '../../components/Link';
import history from '../../history';
import {parse as qsParse, stringify as qsStringify} from 'querystring';
import SearchBox from '../../components/SearchBox';

import {ContextConsumer} from '../../components/ContextProvider';
import DropdownMenu from 'react-dd-menu';
// import Ratio from '../ratio/Ratio'

// import SearchBox from '../../components/SearchBox';

const searchOffset = '?'.length;

const ARCHIVE_ITEMS = gql`
  mutation archiveItems($itemIds: [String!]) {
    archiveAucItems(itemIds: $itemIds) {
      results
    }
  }
`;

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
  auccat?: string,
  cursor?: number,
  cursorBackward?: number,
|}> {
  constructor(props) {
    super(props);

    this.state = {
      archivingItems: {},
    };
    this.items = [];
  }

  renderItem = (i, key, item = {}) => {
    return (
      <div key={i}
           className={`${s.aucItem} ${this.state.archivingItems[item.id] ? s.aucItemArchiving : ''}`}
           // onClick={() => {
           //   const archivingItems = {...this.state.archivingItems};
           //   if (archivingItems[item.id]) {
           //     delete archivingItems[item.id];
           //   } else {
           //     archivingItems[item.id] = true;
           //   }
           //   this.setState({archivingItems});
           // }}
      >
        <div className={s.aucItemLeftActions}></div>
        <div className={s.aucItemImgWrap}><img className={s.aucItemImg} src={item.imgSrc}/></div>
        <div className={s.aucItemDescWrap}>
          <Link to={`/detail/${item.id}`} className={s.aucItemLink}>{item.title}</Link>
        </div>
        <div className={s.aucItemRightActions}></div>
      </div>
    );
  };

  render() {
    const GQL_GET_AUC_ITEM_LIST = gql`
      query(
      $query: String!,
      $auccat: String,
      $cursor: Int,
      $cursorBackward: Int,
      $count: Int,
      ) {
        getAucItemList(
          query: $query,
          auccat: $auccat,
          cursor: $cursor,
          cursorBackward: $cursorBackward,
          count: $count,
        ) {
          totalCount
          nextCursor
          prevCursor
          items {
            id
            title
            imgSrc
            imgWidth
            imgHeight
            itemURL
          }
        }
      }
    `;
    const queryVariables = {
      query: this.props.q,
      auccat: this.props.auccat,
      cursor: this.props.cursor,
      cursorBackward: this.props.cursorBackward,
      count: 10,
    };
    return (
      <div className={s.root}>
        <Query query={GQL_GET_AUC_ITEM_LIST}
               variables={queryVariables}
        >
          {({
              loading, error, data, fetchMore
            }) => {
            if (error) return <div>boom!!!</div>;
            if (loading) return <div>loading</div>;

            const aucItemList = data.getAucItemList;
            const {totalCount, items, nextCursor, prevCursor} = aucItemList;
            this.items = [...this.items, ...items];
            const isPrevAvailable = typeof prevCursor === 'number' && prevCursor >= 0;
            const isNextAvailable = typeof nextCursor === 'number' && nextCursor >= 0;
            // const archivingItemLength = Object.keys(this.state.archivingItems).length;

            const minSize = Math.min(10, totalCount);
            const reactListLength = this.items.length + (isNextAvailable ? 1 : 0);

            // if (global.document) debugger;

            return (
              <>
                <ApolloConsumer>
                  {apolloClient => (
                    <ContextConsumer>
                      {context => {
                        return (
                          <div className={s.toolbar}>
                            {
                              <button onClick={isPrevAvailable ? (() => {
                                const qs = {
                                  ...qsParse(global.location.search.slice(searchOffset)),
                                  // Collect items backward!
                                  cb: prevCursor,
                                };
                                delete qs.c;
                                history.push({pathname: global.location.pathname, search: qsStringify(qs),});
                              }) : null}
                                      disabled={!isPrevAvailable}
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

                            <div className={s.flexSpacer}>{''}</div>

                            {/*<Mutation mutation={ARCHIVE_ITEMS}*/}
                            {/*update={(cache, { data: {archiveAucItems: {results}}  }) => {*/}
                            {/*cache.writeQuery({*/}
                            {/*query: GQL_GET_AUC_ITEM_LIST,*/}
                            {/*variables: queryVariables,*/}
                            {/*data: {},*/}
                            {/*});*/}
                            {/*// const archivedItems = results.map((archived, i) => archived ? items[i] : null).filter(e => e);*/}
                            {/*// cache.readQuery({*/}
                            {/*//   query: GQL_GET_AUC_ITEM_LIST,*/}
                            {/*//   variables:*/}
                            {/*// })*/}
                            {/*// const { todos } = cache.readQuery({ query: GET_TODOS });*/}
                            {/*// cache.writeQuery({*/}
                            {/*//   query: GET_TODOS,*/}
                            {/*//   data: { todos: todos.concat([addTodo]) }*/}
                            {/*// });*/}
                            {/*}}*/}
                            {/*>{(archiveItems) => {*/}
                            {/*return (*/}
                            {/*<button onClick={() => {*/}
                            {/*archiveItems({*/}
                            {/*variables: {*/}
                            {/*itemIds: Object.keys(this.state.archivingItems),*/}
                            {/*}*/}
                            {/*});*/}
                            {/*this.setState({*/}
                            {/*archivingItems: {},*/}
                            {/*});*/}
                            {/*}}>{*/}
                            {/*archivingItemLength === 0*/}
                            {/*? `Archive ${items.length} items`*/}
                            {/*: `Archive ${archivingItemLength} item${archivingItemLength === 1 ? '' : 's'}`*/}
                            {/*}</button>*/}
                            {/*);*/}
                            {/*}}</Mutation>*/}
                            {' '}
                            <button onClick={isNextAvailable ? (() => {
                              const qs = ({
                                ...qsParse(global.location.search.slice(searchOffset)),
                                c: nextCursor,
                              });
                              delete qs.cb;
                              history.push({pathname: global.location.pathname, search: qsStringify(qs),});
                            }) : null}
                                    disabled={!isNextAvailable}
                            >Next
                            </button>
                          </div>
                        );
                      }}
                    </ContextConsumer>
                  )}
                </ApolloConsumer>

                <div className={s.aucListContainer}>

                  <ReactList
                    type='variable'
                    minSize={minSize}
                    itemRenderer={(index, key) => {
                      let d = items[index];
                      if (!d) {
                        if (typeof nextCursor === 'number') {
                          fetchMore({
                            variables: {cursor: nextCursor,},
                            updateQuery: (prev, {fetchMoreResult}) => {
                              const {items} = prev.getAucItemList;
                              return {
                                getAucItemList: {
                                  ...fetchMoreResult.getAucItemList,
                                  items: [...items, ...fetchMoreResult.getAucItemList.items],
                                },
                              };
                            }
                          });
                        }
                        d = {};
                      }
                      return this.renderItem(index, key, d);
                    }}
                    length={reactListLength}
                  />
                </div>
              </>
            );
          }}
        </Query>

      </div>
    );
  }
}

export default withStyles(s, ddMenuStyle)(Home);

// let aucItemList =
//   loading
//     ? !this.props.q
//     ? {
//       totalCount: 0,
//       items: [],
//     }
//     : {
//       totalCount: (
//         <span
//           style={{width: '4em'}}
//           className={s.loadingPlaceholder}
//         >
//                         &nbsp;
//                       </span>
//       ),
//       items: Array.from(Array(3)).map((_, i) => (
//         <span
//           style={{
//             width: 400,
//             maxWidth: '100%',
//             height: 300,
//             margin: '0 0.5em 0.5em 0',
//           }}
//           key={i}
//           className={s.loadingPlaceholder}
//         >
//                         &nbsp;
//                       </span>
//       )),
//     }
//     : data.getAucItemList;
