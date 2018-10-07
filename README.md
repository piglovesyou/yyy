## YYYY

### What

Yet another Yan Yan Yahuoku, another web client of [Japanese Yahoo! Auction service](https://auctions.yahoo.co.jp/).

### Why

It's hard to list **only articles newly posted** in Yahoo! Auction. It provides a notification system on specific keywords, but some kinds need to be checked up for every pictures, in such as apparel category.

### How

JSDom scraping + Twitter login + Redis storage. You can query articles in YYYY and **archive** them to not be listed anymore, so that you can always list new products.

#### Technology Stack

* Node
	* Server-side Rendering
	* GraphQL
	* Apollo Client
		* Optimistic response
		* Skelton screen
	* Apollo Server
	* React
	* JSDom for scraping, since Yahoo! Auction stopped to provide API in early 2018 :(
	* Project base s†ructure was [React Starter Kit](https://github.com/kriasoft/react-starter-kit)
* Redis
* Twitter API

### License

MIT
