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
import {compose, Query} from 'react-apollo';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
// import gql from './aucItemList.graphql';
import s from './Home.css';

class Home extends React.Component {
  // static propTypes = {
  //   data: PropTypes.shape({
  //     loading: PropTypes.bool.isRequired,
  //     news: PropTypes.arrayOf( ),
  //   }).isRequired,
  // };

  constructor(props) {
    super(props);

    this.state = {queryKeywords: ''};

    this.handleQueryChange = this.handleQueryChange.bind(this);
  }

  handleQueryChange(e) {
    this.setState({
      queryKeywords: e.target.value,
    });
  }

  render() {
    const {queryKeywords} = this.state;

    return (
      <div className={s.root}>
        <div>
          <input type="text" value={queryKeywords} onChange={this.handleQueryChange}/>
        </div>
        <div className={s.container}>
          <Query query={gql`
            query ($query: String!, $from: Int, $count: Int) {
              getAucItemList(query: $query, from: $from, count: $count) {
                totalCount
                items {
                  id
                  imgSrc
                  itemURL
                }
              }
            }
          `} variables={{query: queryKeywords, from: 0, count: 10}}>
            {({loading, error, data}) => {
              if (loading) return <div>loading....</div>;
              if (error) return <div>boom!!!</div>;

              const {getAucItemList: {totalCount, items}} = data;
              return (
                items.map(item => {
                  return (
                    <a href={item.itemURL} target="_blank">
                      <img key={item.id} src={item.imgSrc}/>
                    </a>
                  );
                })
              );
            }}
          </Query>
        </div>
      </div>
    );
  }
}

export default withStyles(s)(Home);
