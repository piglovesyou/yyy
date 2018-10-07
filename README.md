## YYYY

### What

**Yet another Yan Yan Yahuoku**, another unofficial web client of [Japanese Yahoo! Auction](https://auctions.yahoo.co.jp/).

### Why

It's hard to list articles **only newly posted** in Yahoo! Auction. It provides a notification system on specific keywords officially, but I want to check up one by one in their pictures in some kinds, such as apparel category.

### How

JSDom scraping + Twitter login + Redis storage. You can query articles in YYYY and **archive** them to not be listed anymore, so that you can always list new products.

[This](https://github.com/piglovesyou/yyy/blob/master/src/data/schema.js#L216) is the core logic to collect articles with archives in mind. The cursor handles seamless pagination in background.

#### Technology Stack

* Node
	* Server-side Rendering
	* GraphQL
	* Apollo Client
		* Optimistic response
		* Skelton screen
	* Apollo Server
	* React
    * react-list
    * react-list-lazy-load
	* JSDom for scraping, since Yahoo! Auction stopped to provide API in early 2018 :(
	* Project base s†ructure was [React Starter Kit](https://github.com/kriasoft/react-starter-kit)
* Redis
* Twitter API

### License

MIT
