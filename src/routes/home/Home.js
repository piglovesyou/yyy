/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {compose, graphql} from 'react-apollo';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import newsQuery from './aucItemList.graphql';
import s from './Home.css';

class Home extends React.Component {
  // static propTypes = {
  //   data: PropTypes.shape({
  //     loading: PropTypes.bool.isRequired,
  //     news: PropTypes.arrayOf( ),
  //   }).isRequired,
  // };

  render() {
    const {data: {getAucItemList}} = this.props;

    if (!getAucItemList) {
      return <div>boom</div>
    }
    const {totalCount, items} = getAucItemList;

    return (
      <div className={s.root}>
        <div className={s.container}>
          {items.map(item => {
            return <img src={item.imgSrc} />
          })}
        </div>
      </div>
    );
  }
}

export default compose(withStyles(s), graphql(newsQuery))(Home);
