/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { InsertCssProvider } from 'isomorphic-style-loader--react-context/lib/withStyles';
import { ContextProvider } from './ContextProvider';
import type {ContextTypes} from '../types';

class App extends React.PureComponent<{|
  context: ContextTypes,
  children: mixed,
|}> {

  render() {
    // Here, we are at universe level, sure? ;-)
    const { client } = this.props.context;
    // NOTE: If you need to add or modify header, footer etc. of the app,
    // please do that inside the Layout component.
    return (
      <ApolloProvider client={client}>
        <ContextProvider value={this.props.context}>
          <InsertCssProvider value={this.props.context.insertCss}>
            {this.props.children}
          </InsertCssProvider>
        </ContextProvider>
      </ApolloProvider>
    );
  }
}

export default App;
