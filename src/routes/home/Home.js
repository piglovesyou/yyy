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
import LazyLoading from 'react-list-lazy-load';
import { Mutation, Query } from 'react-apollo';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Home.css';
import ddMenuStyle from 'react-dd-menu/dist/react-dd-menu.css';
import Link from '../../components/Link';
import SearchBox from '../../components/SearchBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import remove from 'lodash.remove';

import { ContextConsumer } from '../../components/ContextProvider';
import DropdownMenu from 'react-dd-menu';
// import Ratio from '../ratio/Ratio'

// import SearchBox from '../../components/SearchBox';

// const searchOffset = '?'.length;
const PER_PAGE = 10;

const ARCHIVE_ITEMS = gql`
  mutation archiveItems($itemIds: [String!]) {
    archiveAucItems(itemIds: $itemIds) {
      results
    }
  }
`;

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

class UserIconMenu extends React.Component<{|
  className?: string,
  imageURL: string,
|}> {
  constructor() {
    super();
    this.state = {
      isMenuOpen: false,
    };
    this.click = this.click.bind(this);
    this.toggle = this.toggle.bind(this);
    this.close = this.close.bind(this);
  }

  toggle() {
    this.setState({ isMenuOpen: !this.state.isMenuOpen });
  }

  close() {
    this.setState({ isMenuOpen: false });
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
        <li><Link to="/archived">Archived items</Link></li>
        <li><Link to="/about">What is YYYY</Link></li>
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
  }

  renderItem = (i, key, item, queryCondition, isLoggedIn) => (
      <div key={i}
           className={`${s.aucItem} ${this.state.archivingItems[item.id] ? s.aucItemArchiving : ''}`}
           id={`${i} : ${item.id}`}
      >
        {isLoggedIn ? (
          <Mutation mutation={ARCHIVE_ITEMS}
                    update={(cache, { data: { archiveAucItems: { results } } }) => {
                      const { getAucItemList } = cache.readQuery(queryCondition);

                      // Update local apollo cache
                      remove(getAucItemList.items, { id: item.id });
                      // Also update array for ReactList
                      remove(this.items, { id: item.id });

                      cache.writeQuery({ ...queryCondition, data: { getAucItemList } });
                    }}
          >{archiveItems => (
              <div className={s.aucItemLeftActions}
                   onClick={() => {
                     archiveItems({
                       variables: {
                         itemIds: [item.id],
                       },
                       optimisticResponse: {
                         __typename: 'Mutation',
                         archiveAucItems: {
                           __typename: 'ResponseArchiveAucItems',
                           results: [true],
                         },
                       },
                     });
                   }}>
                <FontAwesomeIcon icon="archive"/>
              </div>
            )}</Mutation>
        ) : null}

        <div className={s.aucItemImgWrap}>
          <a target="_blank" href={`${item.itemURL}#abth_lft`}>
            <img className={s.aucItemImg} src={item.imgSrc}/>
          </a>
        </div>
        <div className={s.aucItemDescWrap}>
          <Link to={`/detail/${item.id}`} className={s.aucItemLink}>{item.title}</Link>
        </div>
        <div className={s.aucItemRightActions} />
      </div>
  );

  render() {
    const queryCondition = {
      query: GQL_GET_AUC_ITEM_LIST,
      variables: {
        query: this.props.q,
        auccat: this.props.auccat,
        cursor: this.props.cursor,
        cursorBackward: this.props.cursorBackward,
        count: PER_PAGE,
      },
    };

    return (

      <ContextConsumer>
        {context => (
            <div className={s.root}>
              <Query {...queryCondition}>
                {({
                    loading, error, data, fetchMore,
                  }) => {
                  if (error) return <div>boom!!!</div>;
                  if (loading) return <div>loading</div>;

                  const aucItemList = data.getAucItemList;
                  const {
 totalCount, items, nextCursor, prevCursor,
} = aucItemList;

                  // const isPrevAvailable = typeof prevCursor === 'number' && prevCursor >= 0;
                  const isNextAvailable = typeof nextCursor === 'number' && nextCursor >= 0;

                  // const minSize = Math.min(10, totalCount);
                  const reactListLength = items.length + (isNextAvailable ? 1 : 0);

                  return (
                    <><div className={s.toolbar}>
                        <div className={s.flexSpacer} />
                        <Link className={s.brand} to="/" tabIndex={0}>
                          YYYY
                        </Link>
                        {context.pathname === '/' && <SearchBox className={s.searchBox}
                                                                q={this.props.q}/>}
                        {context.profile
                          ? <UserIconMenu className={s.userIconImg} imageURL={context.profile.image}/>
                          : <a className={s.loginLinkText} href="/login/twitter">Login</a>}

                        <div className={s.flexSpacer} />
                      </div>
                      <div className={s.aucListContainer}>

                        {items.length ? (
                          <LazyLoading items={items}
                                       length={reactListLength}
                                       pageSize={PER_PAGE}
                                       onRequestPage={(page, cb) => {
                                         fetchMore({
                                           variables: { cursor: nextCursor },
                                           updateQuery: (prev, { fetchMoreResult }) => {
                                             const { items } = prev.getAucItemList;
                                             return {
                                               getAucItemList: {
                                                 ...fetchMoreResult.getAucItemList,
                                                 items: [...items, ...fetchMoreResult.getAucItemList.items],
                                               },
                                             };
                                           },
                                         });
                                         cb();
                                       }}>
                            <ReactList
                              minSize={5} // For SSR
                              type="variable"
                              itemRenderer={(index, key) => this.renderItem(index, key, items[index] || {}, queryCondition, !!context.profile)}
                              length={reactListLength}
                            />
                          </LazyLoading>
                        ) : <div>Empty</div>}

                      </div></>
                  );
                }}
              </Query>
            </div>
          )}
      </ContextConsumer>
    );
  }
}

export default withStyles(s, ddMenuStyle)(Home);
