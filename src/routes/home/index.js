/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import Home from './Home';
import Layout from '../../components/Layout';

function action(context) {
  return {
    title: 'Yet another Yan Yan Yahuoku',
    chunks: ['home'],
    component: (
      <Layout>
        <Home q={context.query.q || ''}
              auccat={context.query.auccat}
              cursor={context.query.c ? Number(context.query.c) : undefined}
              cursorBackward={context.query.cb ? Number(context.query.cb) : undefined}
        />
      </Layout>
    ),
  };
}

export default action;
