// @flow

export type UserType = {
  _id: string,
  name: string,
  image: string,
  provider: string,
};

export type ContextTypes = {
  profile: UserType,
  pathname: string,
  query: { [string]: string },
  // fetch: Function,
  // insertCss: Function,
  // client: any, // Apollo Client
  // ...ReduxProvider.childContextTypes,
};

export type RequestType = express$Request & {
  user: UserType,
};
