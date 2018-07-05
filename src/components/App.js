// @flow

import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { InsertCssProvider } from 'isomorphic-style-loader--react-context/lib/withStyles';
import { ContextProvider } from './ContextProvider';
import type { ContextTypes } from '../types';

class App extends React.PureComponent<{|
  context: ContextTypes,
  apolloClient: mixed,
  insertCss: Function,
  children: mixed,
|}> {
  render() {
    // NOTE: If you need to add or modify header, footer etc. of the app,
    // please do that inside the Layout component.
    return (
      <ApolloProvider client={this.props.apolloClient}>
        <ContextProvider value={this.props.context}>
          <InsertCssProvider value={this.props.insertCss}>
            {this.props.children}
          </InsertCssProvider>
        </ContextProvider>
      </ApolloProvider>
    );
  }
}

export default App;
