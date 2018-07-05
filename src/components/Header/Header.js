// @flow

import React from 'react';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Header.css';
import Link from '../Link';
import Navigation from '../Navigation';
import {ContextConsumer} from '../ContextProvider';

class SearchBox extends React.Component<{|
  q: string,
|}, {|
  q: string,
|}> {
  constructor(props) {
    super(props);

    const {q} = props;
    this.state = {q};
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

    this.setState({q});
  };

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
  // render() {
  //   return (
  //     <div>yeah</div>
  //   )
  // }
}

class Header extends React.Component {
  render() {
    return (
      <ContextConsumer>
        {context => (
          <div className={s.root}>
            <Link className={s.brand} to="/">
              YYY
            </Link>
            <SearchBox q={context.query.q}/>
            <div className={s.flexSpacer}> </div>
            <Navigation/>
          </div>
        )}
      </ContextConsumer>
    );
  }
}

export default withStyles(s)(Header);
