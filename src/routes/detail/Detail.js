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
import PropTypes from 'prop-types';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import { Query } from 'react-apollo';
import s from './Detail.css';
import ContextType from '../../ContextType';
import history from '../../history';

class Detail extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  };

  static contextTypes = ContextType;

  render() {
    const { id } = this.props;
    return (
      <Query
        query={gql`
          query($id: String!) {
            getAucItemDetail(id: $id) {
              id
              title
              state
              priceText
              images {
                src
                height
                width
              }
            }
          }
        `}
        variables={{ id }}
      >
        {({ loading, error, data }) => {
          if (error) return <div>Error...</div>;
          const aucItemDetail = loading
            ? {
                title: (
                  <span
                    style={{ width: '100%' }}
                    className={s.loadingPlaceholder}
                  >
                    &nbsp;
                  </span>
                ),
                priceText: (
                  <span
                    style={{ width: '6em' }}
                    className={s.loadingPlaceholder}
                  >
                    &nbsp;
                  </span>
                ),
                images: [
                  <div
                    style={{ width: 400, maxWidth: '100%', height: 300 }}
                    key="yeah"
                    className={s.loadingPlaceholder}
                  >
                    &nbsp;
                  </div>,
                ],
              }
            : data.getAucItemDetail;
          const { title, priceText, images } = aucItemDetail;
          return (
            <div className={s.root}>
              <div className={s.container}>
                <button
                  onClick={() => {
                    history.goBack();
                    // history.replace('/');
                  }}
                >
                  &larr;Go back
                </button>
                <h2>{title}</h2>
                <h2>{priceText}</h2>
                <div>
                  {images.map((img, i) =>
                      (img.props ? (
                        img
                      ) : (
                        <img style={{ maxWidth: '100%' }} key={i} {...img} />
                      )))}
                </div>
              </div>
            </div>
          );
        }}
      </Query>
    );
  }
}

export default withStyles(s)(Detail);
