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

// import SearchBox from '../../components/SearchBox';


class Home extends React.Component<{|
  q: string,
|}> {
  render() {
    return (
      <div className={s.root}>
        <div className={s.container}>
          <Query
            query={gql`
              query($query: String!, $cursor: Int, $count: Int) {
                getAucItemList(query: $query, cursor: $cursor, count: $count) {
                  totalCount
                  nextCursor
                  items {
                    id
                    imgSrc
                    itemURL
                  }
                }
              }
            `}
            variables={{query: this.props.q, cursor: 0, count: 4}}
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
              const {totalCount, items, nextCursor,} = aucItemList;
              return (
                <div>
                  <div className={s.toolbar}>
                    <div>total: {totalCount}</div>
                    <div className={s.flexSpacer}></div>
                    {
                      (typeof nextCursor === 'number' && nextCursor > 0) &&
                      <button onClick={() => {
                        fetchMore({
                          variables: {
                            cursor: nextCursor
                          },
                          updateQuery(previousResult, { fetchMoreResult }) {
                            return {...previousResult, ...fetchMoreResult};
                          },
                        });
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
