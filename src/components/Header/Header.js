// @flow

import React from 'react';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Header.css';
import Link from '../Link';
import Navigation from '../Navigation';
import {ContextConsumer} from '../ContextProvider';
import SearchBox from '../SearchBox';

class Header extends React.Component<void> {
  render() {
    return (
      <ContextConsumer>
        {context => (
          <div className={s.root}>
            <Link className={s.brand} to="/" tabIndex={0}>
              YYY
            </Link>
            {context.pathname === '/' && <SearchBox q={context.query.q}/>}
            <div className={s.flexSpacer}> </div>
            <Navigation/>
          </div>
        )}
      </ContextConsumer>
    );
  }
}

export default withStyles(s)(Header);
