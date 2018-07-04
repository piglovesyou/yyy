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
import history from '../../history';
import Link from '../../components/Link';
import {ContextConsumer} from '../../components/ContextProvider';

class SearchBox extends React.Component<{|
  q: string,
|}> {
  constructor(props) {
    super(props);

    const {q} = props;
    this.state = {q};

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleQueryChange = this.handleQueryChange.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    history.push({
      pathname: global.location.pathname,
      search: `q=${encodeURIComponent(this.state.q)}`,
    });
  }

  handleQueryChange(e) {
    const q = e.target.value;

    this.setState({q});
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input tabIndex="1"
               type="text"
               value={this.state.q}
               onChange={this.handleQueryChange}
        />
        <button disabled={this.props.q === this.state.q}>Go</button>
      </form>
    );
  }
}

class Home extends React.Component<> {
  render() {
    return (
      <ContextConsumer>{context => {
        return (
          <div className={s.root}>
            <SearchBox q={context.query.q}/>
            <div className={s.container}>
              <Query
                query={gql`
              query($query: String!, $from: Int, $count: Int) {
                getAucItemList(query: $query, from: $from, count: $count) {
                  totalCount
                  items {
                    id
                    imgSrc
                    itemURL
                  }
                }
              }
            `}
                variables={{query: this.props.q, from: 0, count: 10}}
              >
                {({loading, error, data, fetchMore}) => {
                  if (error) return <div>boom!!!</div>;
                  const aucItemList =
                    loading
                      ? !this.props.q
                      ? {
                        totalCount: 0,
                        items: 0,
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
                  const {totalCount, items} = aucItemList;
                  return (
                    <div>
                      <div>
                        <span>total: </span>
                        {totalCount}
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
      }}</ContextConsumer>
    );
  }
}

export default withStyles(s)(Home);
