## YYYY

### What

Yet another Yan Yan Yahuoku, another unofficial web client of [Japanese Yahoo! Auction](https://auctions.yahoo.co.jp/), [hosted on HEROKU](https://yyygql.herokuapp.com/), [source code on GitHub](https://github.com/piglovesyou/yyy).

### Why

It's hard to list articles **only newly posted** in Yahoo! Auction. Officially it provides a notification system on specific keywords, but I want to check up one by one in their pictures in some kinds, such as apparel.

### How

JSDom scraping + Twitter login + Redis storage. In YYYY you can query articles and **archive** them to not be listed anymore, so that you can always list new products.

[This](https://github.com/piglovesyou/yyy/blob/master/src/data/schema.js#L216) is the core logic to collect articles with archives in mind. The cursor handles seamless pagination in background.

#### Technology Stack

* Node
	* Server-side Rendering
	* GraphQL
    * Apollo Server
	* Apollo Client
		* Optimistic response
		* Skelton screen
	* React
    * react-list
    * react-list-lazy-load
	* JSDom for scraping, since Yahoo! Auction stopped to provide API in early 2018 :(
	* [React Starter Kit](https://github.com/kriasoft/react-starter-kit) as a project base structure
* Redis
* Twitter API
* Heroku

### License

MIT
