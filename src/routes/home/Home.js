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
import {Query} from 'react-apollo';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
// import gql from './aucItemList.graphql';
import s from './Home.css';
import Link from '../../components/Link';
import history from '../../history';
import {parse as qsParse, stringify as qsStringify} from 'querystring';

// import SearchBox from '../../components/SearchBox';

const searchOffset = '?'.length;

class Home extends React.Component<{|
  q: string,
  cursor?: number,
  cursorBackward?: number,
|}> {

  render() {
    return (
      <div className={s.root}>
        <div className={s.container}>
          <Query
            query={gql`
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
                loading, error, data, fetchMore,
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
              return (
                <div>
                  <div className={s.toolbar}>
                    {
                      enablePrev && <button onClick={() => {
                        const qs = {
                          ...qsParse(global.location.search.slice(searchOffset)),
                          // Collect items backward!
                          cb: prevCursor,
                        };
                        delete qs.c;
                        history.push({pathname: global.location.pathname, search: qsStringify(qs),});
                      }}>Prev</button>
                    }
                    <div>total: {totalCount}</div>
                    <div className={s.flexSpacer}></div>
                    {
                      enableNext && <button onClick={() => {
                        const qs = ({
                          ...qsParse(global.location.search.slice(searchOffset)),
                          c: nextCursor,
                        });
                        delete qs.cb;
                        history.push({pathname: global.location.pathname, search: qsStringify(qs),});
                      }}>Next</button>
                    }
                  </div>
                  {items.map((item, i) =>
                    (item.props ? (
                      item
                    ) : (
                      <Link to={`/detail/${item.id}`} key={i}>
                        <img className={s.aucItemImg} src={item.imgSrc}/>
                      </Link>
                    )))}
                </div>
              );
            }}
          </Query>
        </div>
      </div>
    );
  }
}

export default withStyles(s)(Home);
