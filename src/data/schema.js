// @flow

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { merge } from 'lodash';
import { makeExecutableSchema } from 'graphql-tools';

// Merge all of the resolver objects together
// Put schema together into one array of schema strings
const resolvers = {
  RootQuery: {
    async getAucItem(_: any, args: { id: string }) {
      const res = await fetch(
        `https://page.auctions.yahoo.co.jp/jp/auction/${args.id}`,
      );
      const html = await res.text();
      const {
        window: { document },
      } = new JSDOM(html);

      const title = document.querySelector('.ProductTitle__text').textContent;
      const price = extractTextNodes(
        document.querySelector('.Price__value'),
      ).replace(/[^\d]/g, '');

      const images = Array.from(
        document.querySelectorAll('.ProductImage__images img'),
      ).map(e => ({
        src: e.src,
        width: e.width,
        height: e.height,
      }));

      // https://auctions.c.yimg.jp/images.auctions.yahoo.co.jp/image/dr000/auc0406/users/09f4a4a64589279a20d24912a1052df827f40014/i-img450x600-1529081824tojb141015649.jpg

      const itemBodyValueConverters = {
        状態: String,
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
        オークションID: String,
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
        return { ...rv, [key]: valueConverter(value) };
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

const schema = [
  `
  type AucItemImage {
    src: String
    width: Int
    height: Int
  }
  
  type AucItem {
    id: String
    title: String
    state: String
    price: Int
    images: [AucItemImage]
  }
  
  type RootQuery {
    getAucItem(id: String): AucItem
  }
  
  schema {
    query: RootQuery
  }
`];

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  ...(__DEV__ ? { log: e => console.error(e.stack) } : {}),
});

function extractTextNodes(node: any) {
  const textNodeType = 3;
  return Array.from(node.childNodes)
    .filter(e => e.nodeType === textNodeType)
    .map(e => e.textContent)
    .join('');
}
