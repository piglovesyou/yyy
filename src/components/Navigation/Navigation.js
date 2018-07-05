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
import s from './Navigation.css';
import Link from '../Link';
import { ContextConsumer } from '../ContextProvider';

class Navigation extends React.Component {
  render() {
    return (
      <div className={s.root} role="navigation">
        {/* <Link className={s.link} to="/ratio">Ratio</Link> */}
        <a className={s.link} href="/login/twitter">Login</a>
        <a className={s.link} href="/graphql">GraphQL</a>
        <Link className={s.link} to="/about">About</Link>
        <ContextConsumer>
          {context => (context.profile ? <img className={s.userIconImg} src={context.profile.image}/> : null)}
        </ContextConsumer>
      </div>
    );
  }
}

export default withStyles(s)(Navigation);
