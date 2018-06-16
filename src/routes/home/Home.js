/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import {compose, Query} from 'react-apollo';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import gql from './aucItemList.graphql';
import s from './Home.css';

class Home extends React.Component {
  // static propTypes = {
  //   data: PropTypes.shape({
  //     loading: PropTypes.bool.isRequired,
  //     news: PropTypes.arrayOf( ),
  //   }).isRequired,
  // };

  render() {
    return (
      <Query query={gql}>
        {({loading, error, data}) => {
          if (loading) {
            return <div>loading....</div>;
          }
          if (error) {
            return <div>boom!!!</div>;
          }
          const {getAucItemList: {totalCount, items}} = data;
          return (
            <div className={s.root}>
              <div className={s.container}>
                {items.map(item => {
                  return <img key={item.id} src={item.imgSrc}/>;
                })}
              </div>
            </div>
          );
        }}
      </Query>
    );
  }
}

export default withStyles(s)(Home);
