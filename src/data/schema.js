// @flow

import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { makeExecutableSchema } from 'graphql-tools';
import { basename } from 'path';
import { URL } from 'url';
import { fromArray } from 'hole';
import range from 'lodash.range';
import LRU from 'lru-cache';
// $FlowFixMe
import typeDefs from './schema.graphql';
import persist from '../persist';

const AUC_LIST_PER_PAGE = 20;

// const typeDefs = [FS.readFileSync(Path.join(__dirname, 'schema.graphql'))];
const schema = [typeDefs];

const dummyThroughputDelay = 2000;

const cache = LRU({
  max: 500,
  // length: function (n, key) { return n * 2 + key.length; } ,
  // dispose: function (key, n) { n.close(); } ,
  maxAge: 1000 * 60 * 60,
});

const currentProjects = {
  projects: [
    { id: 'A01234', name: 'Project A', ratio: 1 },
    { id: 'B01234', name: 'Project B', ratio: 2 },
  ],
};

// Merge all of the resolver objects together
// Put schema together into one array of schema strings
const resolvers = {
  Query: {
    async getAucItemList(_: any, { query, from = 0, count = 4 }: { query: string, from: number, count: number }) {
      // TODO: consider requesting out of totalCount range

      const normalizedQuery = query.replace(/　+/g, ' ').trim();

      const reqFirstPage = getPageIndex(from);
      const reqLastPage = getPageIndex(from + count);

      const xs = await fromArray(range(reqFirstPage, reqLastPage + 1))
        .pipe(
          (page) => {
            const from = page * AUC_LIST_PER_PAGE; // 20, 40, ...
            return requestItemList(normalizedQuery, from);
          },
          1,
        )
        .collect();

      const { totalCount } = xs[0];
      const fullItems = xs.reduce((items, rv) => [...items, ...rv.items], []);

      const sliceFrom = from % AUC_LIST_PER_PAGE;
      const items = fullItems.slice(sliceFrom, sliceFrom + count);

      return {
        totalCount,
        returnedCount: fullItems.length,
        items,
      };

      async function requestItemList(query, from) {
        const totalCountCacheKey = `total:${query}`;
        const pageCacheKey = `page:${query}${from}`;

        const cachedTotalCount = cache.get(totalCountCacheKey);
        if (typeof cachedTotalCount === 'number' && cachedTotalCount < from) {
          // Being requested over search result
          return {
            totalCount: cachedTotalCount,
            items: [],
          };
        }

        if (cache.has(pageCacheKey)) {
          return cache.get(pageCacheKey);
        }

        const url = makeURL('https://auctions.yahoo.co.jp/search/search', {
          p: query,
          b: from + 1, // Item number starting from 1
          n: AUC_LIST_PER_PAGE, // per page
          mode: 1, // grid view
          select: 22, // 新着順
          // aucmaxprice: 40000
          // price_type: currentprice
          // max: 40000
          exflg: 1, // ?
        });
        const res = await fetch(url);
        const html = await res.text();
        const {
          window: { document },
        } = new JSDOM(html);

        const totalEl = document.querySelector('#AS-m19 .total em');
        if (!totalEl) {
          // Zero search result
          const totalCount = 0;
          const rv = {
            totalCount,
            items: [],
          };
          cache.set(totalCountCacheKey, totalCount);
          cache.set(pageCacheKey, rv);
          return rv;
        }

        const totalCount = Number(totalEl.textContent);

        const items = Array.from(document.querySelectorAll('#list01 .inner .cf'))
          .map((e) => {
            const imgEl = e.querySelector('img');
            if (!imgEl) return undefined; // TODO: why
            const imgAncEl = imgEl.parentNode;
            const price = parsePrice(e.querySelector('.pri1').textContent);

            const title = imgEl.alt;
            const imgSrc = imgEl.src;
            const imgWidth = imgEl.width;
            const imgHeight = imgEl.height;
            const itemURL = imgAncEl.href;
            const id = basename(itemURL);

            return {
              id, title, imgSrc, imgWidth, imgHeight, itemURL, price,
            };
          })
          .filter(e => e);

        const resolvedValue = { totalCount, items };
        cache.set(pageCacheKey, resolvedValue);
        cache.set(totalCountCacheKey, totalCount);

        return resolvedValue;
      }
    },

    async getAucItemDetail(_: any, args: { id: string }) {
      const res = await fetch(`https://page.auctions.yahoo.co.jp/jp/auction/${args.id}`);
      const html = await res.text();
      const {
        window: { document },
      } = new JSDOM(html);

      const title = document.querySelector('.ProductTitle__text').textContent;
      const priceText = extractText(document.querySelector('.Price__value'));
      const price = parsePrice(priceText);

      const images = Array.from(document.querySelectorAll('.ProductImage__images img')).map(e => ({
        src: e.src,
        width: e.width,
        height: e.height,
      }));

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
      const bodyValues = Array.from(document
        .querySelector('.ProductDetail__body')
        .querySelectorAll('dt, dd')).reduce((rv, e, i, a) => {
        if (i % 2) return rv;
        const key = e.textContent;
        const value = a[i + 1].textContent.replace('：', '');
        const valueConverter = itemBodyValueConverters[key] || (e => e);
        return { ...rv, [key]: valueConverter(value) };
      }, {});

      return {
        id: bodyValues['オークションID'],
        price,
        priceText,
        title,
        state: bodyValues['状態'],
        images,
      };
    },
    async getCurrentProjects(/* req, data */) {
      await new Promise(resolve => setTimeout(resolve, dummyThroughputDelay));
      return currentProjects;
    },
  },
  Mutation: {
    async archiveAucItems(req, { userId, itemIds }: { userId: string, itemIds: [string] })
      : Promise<{ userId: string, addedItemIds: [string] }> {
      const addedItemIds = await operateArchivedAucItem(userId, itemIds, 'sadd');

      return { userId, addedItemIds };
    },
    async unarchiveAucItems(req, { userId, itemIds }: { userId: string, itemIds: [string] })
      : Promise<{ userId: string, itemIds: [string] }> {
      const removedItemIds = await operateArchivedAucItem(userId, itemIds, 'srem');

      return { userId, removedItemIds };
    },
    async updateProjectRatio(req, { projectId, ratio }) {
      await new Promise(resolve => setTimeout(resolve, dummyThroughputDelay));

      const p = currentProjects.projects.find(p => p.id === projectId);
      if (!p) {
        throw new Error('Project not found');
      }
      p.ratio = ratio;
      return p;
    },
    // async includeInArchivedAucItem(req, {userId, itemIds}: { userId: string, itemIds: [string] }): Promise<{ userId:
    // string, itemIds: [string] }> { const removedItemIds = await operateArchivedAucItem(userId, itemIds,
    // 'sismember');  return {userId, removedItemIds,}; },
  },
};

async function operateArchivedAucItem(userId, itemIds, operation: string) {
  const key = `user:${userId}:archivedAucItems`;

  const results = await itemIds.reduce((multi, itemId) => multi[operation](key, itemId), persist.multi()).execp();

  const addedItemIds = results.reduce((operated, result, index) => {
    if (result === 1) {
      return [...operated, itemIds[index]];
    }
    return operated;
  }, []);
  return addedItemIds;
}

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  ...(__DEV__ ? { log: e => console.error(e.stack) } : {}),
});

function makeURL(base, params: Object) {
  const url = new URL(base);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  return url;
}

function extractText(node: any) {
  const textNodeType = 3;
  return Array.from(node.childNodes)
    .filter(e => e.nodeType === textNodeType)
    .map(e => e.textContent)
    .join('');
}

function parsePrice(str) {
  return Number(str.replace(/[^\d]/g, ''));
}

function getPageIndex(from) {
  return Math.floor(from / AUC_LIST_PER_PAGE);
}

