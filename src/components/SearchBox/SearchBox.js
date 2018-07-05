// @flow

import React from 'react';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import history from '../../history';
import s from './SearchBox.css';

class SearchBox extends React.Component<{|
  q: string,
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

    history.push({
      pathname: global.location.pathname,
      search: `q=${encodeURIComponent(this.state.q)}`,
    });
  };

  handleQueryChange = (e) => {
    const q = e.target.value;

    this.setState({ q });
  };

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <input className={s.inputText}
               placeholder="Keywords or Yahoo! Auction URL"
               type="text"
               value={this.state.q}
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
