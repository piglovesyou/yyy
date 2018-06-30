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

class Header extends React.Component {
  render() {
    return (
      <div className={s.root}>
        <ContextConsumer>
          {context => (context.profile ? <img src={context.profile.image}/> : null)}
        </ContextConsumer>
        <div className={s.container}>
          <Navigation/>
          <Link className={s.brand} to="/">
            YYY
          </Link>
        </div>
      </div>
    );
  }
}

export default withStyles(s)(Header);
