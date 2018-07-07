// @flow

import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import expressGraphQL from 'express-graphql';
import React from 'react';
import ReactDOM from 'react-dom/server';
import {getDataFromTree} from 'react-apollo';
import PrettyError from 'pretty-error';
import connectRedis from 'connect-redis';
import session from 'express-session';

import createApolloClient from './core/createApolloClient';
import App from './components/App';
import Html from './components/Html';
import {ErrorPageWithoutStyle} from './routes/error/ErrorPage';
import errorPageStyle from './routes/error/ErrorPage.css';
import router from './router';
import schema from './data/schema';
// $FlowFixMe
import chunks from './chunk-manifest.json'; // eslint-disable-line import/no-unresolved
import config from './config';
import passport from './passport';
import persist from './persist';
import type {ContextTypes, UserType} from './types';

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

//
// Tell any CSS tooling (such as Material UI) to use all vendor prefixes if the
// user agent is not known.
// -----------------------------------------------------------------------------
global.navigator = global.navigator || {};
global.navigator.userAgent = global.navigator.userAgent || 'all';

const app = express();

//
// If you are using proxy from external machine, you can set TRUST_PROXY env
// Default is to trust proxy headers only from loopback interface.
// -----------------------------------------------------------------------------
app.set('trust proxy', config.trustProxy);

//
// Register Node.js middleware
// -----------------------------------------------------------------------------
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const RedisStore = connectRedis(session);

app.use(session({
  store: new RedisStore({client: persist}),
  secret: 'keyboard cat',
  resave: false,
}));
app.use(passport.initialize());
app.use(passport.session());

//
// Authentication
// -----------------------------------------------------------------------------
app.get('/login/twitter', passport.authenticate('twitter'));
app.get('/login/twitter/callback', passport.authenticate('twitter', {
  failureRedirect: '/login',
}), (req, res) => {
  res.redirect('/');
});
app.get('/logout', (req, res) => {
  if (req.session) req.session.destroy();
  res.redirect('/');
});

//
// Register API middleware
// -----------------------------------------------------------------------------
const graphqlMiddleware = expressGraphQL(req => ({
  schema,
  graphiql: true, // __DEV__,
  rootValue: {request: req},
  pretty: __DEV__,
}));
app.use('/graphql', graphqlMiddleware);

//
// Register server-side rendering middleware
// -----------------------------------------------------------------------------
app.get('*', async (req, res, next) => {
  try {
    const css = new Set();

    const insertCss = (...styles) => {
      // eslint-disable-next-line no-underscore-dangle
      styles.forEach(style => css.add(style._getCss()));
    };

    const apolloClient = createApolloClient({
      schema,
      rootValue: {request: req},
    });

    const initialState = {
      user: req.user || null,
    };

    const context: ContextTypes = {
      profile: (req.user: UserType),
      pathname: req.path,
      query: req.query,
    };

    const route = await router.resolve(context);

    if (route.redirect) {
      res.redirect(route.status || 302, route.redirect);
      return;
    }

    const data = {...route};
    const rootComponent = (
      <App apolloClient={apolloClient}
           insertCss={insertCss}
           context={context}>{route.component}</App>
    );
    await getDataFromTree(rootComponent);
    // this is here because of Apollo redux APOLLO_QUERY_STOP action
    // await Promise.delay(0);
    data.children = await ReactDOM.renderToString(rootComponent);
    data.styles = [{id: 'css', cssText: [...css].join('')}];

    const scripts = new Set();
    const addChunk = (chunk) => {
      if (chunks[chunk]) {
        chunks[chunk].forEach(asset => scripts.add(asset));
      } else if (__DEV__) {
        throw new Error(`Chunk with name '${chunk}' cannot be found`);
      }
    };
    addChunk('client');
    if (route.chunk) addChunk(route.chunk);
    if (route.chunks) route.chunks.forEach(addChunk);
    data.scripts = Array.from(scripts);

    data.app = {
      apiUrl: config.api.clientUrl,
      state: initialState,
      apolloState: apolloClient.extract(),
    };

    // const html = ReactDOM.renderToStaticMarkup(<Html {...data} />);
    // res.status(route.status || 200);
    // res.send(`<!doctype html>${html}`);

    const html = ReactDOM.renderToStaticNodeStream(<Html {...data} />);
    res.status(route.status || 200);
    res.write(`<!doctype html>`);
    html.on('end', res.end.bind(res));
    html.pipe(res);

  } catch (err) {
    next(err);
  }
});

//
// Error handling
// -----------------------------------------------------------------------------
const pe = new PrettyError();
pe.skipNodeFiles();
pe.skipPackage('express');

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(pe.render(err));
  const html = ReactDOM.renderToStaticMarkup(<Html title="Internal Server Error"
                                                   description={err.message}
                                                   styles={[
                                                     {
                                                       id: 'css',
                                                       cssText: errorPageStyle._getCss()
                                                     }
                                                   ]} // eslint-disable-line no-underscore-dangle
  >{ReactDOM.renderToString(<ErrorPageWithoutStyle error={err}/>)}
  </Html>);
  res.status(err.status || 500);
  res.send(`<!doctype html>${html}`);
});

//
// Launch the server
// -----------------------------------------------------------------------------
if (!module.hot) {
  app.listen(config.port, () => {
    console.info(`The server is running at http://localhost:${config.port}/`);
  });
}

//
// Hot Module Replacement
// -----------------------------------------------------------------------------
if (typeof module.hot === 'object') {
  app.hot = module.hot;
  // $FlowFixMe
  module.hot.accept('./router');
}

export default app;
