// @flow

export type UserType = {
  _id: string,
  name: string,
  image: string,
  provider: string,
};

export type ContextTypes = {
  profile: UserType,
  // fetch: Function,
  pathname: string,
  query: { [string]: string },
  // insertCss: Function,
  // client: any, // Apollo Client
  // ...ReduxProvider.childContextTypes,
};
