// @flow

export type UserType = {
  _id: string,
  name: string,
  image: string,
  provider: string,
};

export type ContextTypes = {
  profile: UserType,
  insertCss: Function,
  fetch: Function,
  pathname: string,
  query: { [string]: string },
  client: any, // Apollo Client
  // ...ReduxProvider.childContextTypes,
};
