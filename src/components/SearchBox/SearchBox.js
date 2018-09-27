// @flow

import React from 'react';
import { parse as urlParse } from 'url';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import history from '../../history';
import s from './SearchBox.css';
import { stringify as qsStringify } from 'querystring';

class SearchBox extends React.Component<{|
  q: string,
  className: string,
|}, {|
  q: string,
|}> {
  constructor(props) {
    super(props);

    const { q } = props;
    this.state = { q };
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { q } = this.state;

    let search = '';
    const url = urlParse(q, true);
    const isAucURL = url.host === 'auctions.yahoo.co.jp'
      && url.query
      && typeof url.query.p === 'string';

    if (isAucURL) {
      search = qsStringify({
        q: url.query.p,
        ...(url.query && typeof url.query.auccat === 'string' ? { auccat: url.query.auccat } : null),
      });
    } else if (q) {
      search = qsStringify({ q });
    }

    history.push({
      pathname: global.location.pathname,
      search,
    });

    if (isAucURL) {
      this.setState({ q: url.query.p });
    }
  };

  handleQueryChange = (e) => {
    const q = e.target.value;

    this.setState({ q });
  };

  render() {
    return (
      <form className={this.props.className} onSubmit={this.handleSubmit}>
        <input className={s.inputText}
               placeholder="Keywords or Yahoo! Auction URL"
               type="text"
               value={this.state.q || ''}
               onChange={this.handleQueryChange}
        />
        <button className={s.button}
                disabled={this.props.q === this.state.q}>Go
        </button>
      </form>
    );
  }
}

export default withStyles(s)(SearchBox);
