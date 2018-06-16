// @flow

import fetch from 'node-fetch';
import {JSDOM} from 'jsdom';
import {merge} from 'lodash';
import {makeExecutableSchema} from 'graphql-tools';
import {basename} from 'path';
import {URL} from 'url';

const schema = [
  `
  type AucItemImage {
    src: String
    width: Int
    height: Int
  }
  
  type AucItemDetail {
    id: String
    title: String
    state: String
    price: Int
    images: [AucItemImage]
  }
  
  type AucItem {
    id: String
    title: String
    imgSrc: String
    imgWidth: Int
    imgHeight: Int
    itemURL: String
    price: Int
  }
  
  type AucItemList {
    totalCount: Int
    items: [AucItem]
  }
  
  type RootQuery {
    getAucItemDetail(id: String): AucItemDetail
    getAucItemList(query: String): AucItemList
  }
  
  schema {
    query: RootQuery
  }
`
];

// Merge all of the resolver objects together
// Put schema together into one array of schema strings
const resolvers = {
  RootQuery: {
    async getAucItemList(_: any, {query}: { query: string, }) {
      const url = makeURL('https://auctions.yahoo.co.jp/search/search', {
        p: query,
        n: 20, // per page
        mode: 1, // grid view
        select: 22, // 新着順
        // aucmaxprice: 40000
        // price_type: currentprice
        // max: 40000
        exflg: 1, // ?
        b: 1, // ?
      });
      const res = await fetch(url);
      const html = await res.text();
      const {
        window: {document},
      } = new JSDOM(html);

      const totalCount = Number(document.querySelector('#AS-m19 .total em').textContent);

      const items = Array.from(document.querySelectorAll('#list01 .inner .cf'))
        .map(e => {
          const imgEl = e.querySelector('img');
          if (!imgEl) return; // TODO: why
          const imgAncEl = imgEl.parentNode;
          const price = parsePrice(e.querySelector('.pri1').textContent);

          const title = imgEl.alt;
          const imgSrc = imgEl.src;
          const imgWidth = imgEl.width;
          const imgHeight = imgEl.height;
          const itemURL = imgAncEl.href;
          const id = basename(itemURL);

          return {id, title, imgSrc, imgWidth, imgHeight, itemURL, price};
        }).filter(e => e);

      return {
        totalCount,
        returnedCount: items.length,
        items,
      };
    },

    async getAucItemDetail(_: any, args: { id: string }) {
      const res = await fetch(
        `https://page.auctions.yahoo.co.jp/jp/auction/${args.id}`,
      );
      const html = await res.text();
      const {
        window: {document},
      } = new JSDOM(html);

      const title = document.querySelector('.ProductTitle__text').textContent;
      const price = parsePrice(extractTextNodes(
        document.querySelector('.Price__value'),
      ));

      const images = Array.from(
        document.querySelectorAll('.ProductImage__images img'),
      ).map(e => ({
        src: e.src,
        width: e.width,
        height: e.height,
      }));

      const itemBodyValueConverters = {
        '状態': String,
        // "個数",
        // "開始日時",
        // "終了日時",
        // "自動延長",
        // "早期終了",
        // "返品",
        // "入札者評価制限",
        // "入札者認証制限",
        // "最高額入札者",
        // "開始価格",
        'オークションID': String,
      };
      const bodyValues = Array.from(
        document
          .querySelector('.ProductDetail__body')
          .querySelectorAll('dt, dd'),
      ).reduce((rv, e, i, a) => {
        if (i % 2) return rv;
        const key = e.textContent;
        const value = a[i + 1].textContent.replace('：', '');
        const valueConverter = itemBodyValueConverters[key] || (e => e);
        return {...rv, [key]: valueConverter(value)};
      }, {});

      return {
        id: bodyValues['オークションID'],
        price,
        title,
        state: bodyValues['状態'],
        images,
      };
    },
  },
};

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  ...(__DEV__ ? {log: e => console.error(e.stack)} : {}),
});

function makeURL(base, params) {
  const url = new URL(base);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  return url;
}

function extractTextNodes(node: any) {
  const textNodeType = 3;
  return Array.from(node.childNodes)
    .filter(e => e.nodeType === textNodeType)
    .map(e => e.textContent)
    .join('');
}

function parsePrice(str) {
  return Number(str.replace(/[^\d]/g, ''));
}
