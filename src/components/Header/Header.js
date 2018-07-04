/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from 'isomorphic-style-loader--react-context/lib/withStyles';
import s from './Header.css';
import Link from '../Link';
import Navigation from '../Navigation';
import {ContextConsumer} from '../ContextProvider';
import SearchBox from '../SearchBox';

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
            <div className={s.flexSpacer}></div>
            <Navigation/>
          </div>
        )}
      </ContextConsumer>
    );
  }
}

export default withStyles(s)(Header);
