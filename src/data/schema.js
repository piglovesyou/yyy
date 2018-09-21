// @flow

import fetch from 'node-fetch';
import {JSDOM} from 'jsdom';
import {makeExecutableSchema} from 'graphql-tools';
import {basename} from 'path';
import {URL} from 'url';
import {fromArray} from 'hole';
import LRU from 'lru-cache';
// $FlowFixMe
import typeDefs from './schema.graphql';
import persist from '../persist';
import type {RequestType} from '../types';
import {stringify as qsStringify} from 'querystring';

type AucItemList = {
  totalCount: number,
  items: mixed[],
}

const AUC_LIST_PER_PAGE = 100;

// const typeDefs = [FS.readFileSync(Path.join(__dirname, 'schema.graphql'))];
const schema = [typeDefs];

const dummyThroughputDelay = 2000;

const cache: LRU<string, mixed> = LRU({
  max: 500,
  // length: function (n, key) { return n * 2 + key.length; } ,
  // dispose: function (key, n) { n.close(); } ,
  maxAge: 1000 * 60 * 60,
});

const currentProjects = {
  projects: [
    {id: 'A01234', name: 'Project A', ratio: 1},
    {id: 'B01234', name: 'Project B', ratio: 2},
  ],
};

function normalizeQuery(query) {
  const normalizedQuery = query.replace(/　+/g, ' ').trim();
  return normalizedQuery;
}

const resolvers = {
  Query: {
    async getAucItemList(
      {request}: { request: RequestType },
      {query, auccat, cursor, cursorBackward, count = 4}: { query: string, auccat?: string, cursor?: number, cursorBackward?: number, count?: number, }) {
      if (typeof cursor !== 'undefined' && typeof cursorBackward !== 'undefined') throw new Error('Kidding me?');
      if (typeof cursor === 'undefined' && typeof cursorBackward === 'undefined') cursor = 0;

      const inc = typeof cursor === 'number';
      const c = inc ? cursor : cursorBackward;

      if (typeof c === 'undefined') throw new Error('Never'); // For flow

      const user = request.user;
      const userId = user && user._id;
      const normalizedQuery = normalizeQuery(query);

      const firstIndexInPage = getFirstIndexInPage(c);
      const rawReqParams = { p: normalizedQuery, ...(auccat ? {auccat} : null), };
      const {totalCount, items} = await requestAucItemList(rawReqParams, firstIndexInPage);

      const {collected, nextCursor, prevCursor} = await collectAucItems([], rawReqParams, count, inc, c, c, totalCount, items, userId);

      return {
        totalCount,
        nextCursor,
        prevCursor,
        items: collected,
      };
    },

    async getAucItemDetail(req: $Subtype<express$Request>, args: { id: string }) {
      const res = await fetch(`https://page.auctions.yahoo.co.jp/jp/auction/${args.id}`);
      const html = await res.text();
      const {
        window: {document},
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
        return {...rv, [key]: valueConverter(value)};
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
    async archiveAucItems({request}: { request: RequestType }, {itemIds}: { userId: string, itemIds: [string] })
      : Promise<{ userId: string, results: boolean[] }> {
      const user = request.user;
      const userId = user && user._id;
      if (!userId) throw new Error('Not a logged in user.');
      const results = await operateArchivedAucItem(userId, itemIds, 'sadd');
      return {userId, results};
    },

    async unarchiveAucItems({request}: { request: RequestType }, {itemIds}: { userId: string, itemIds: [string] })
      : Promise<{ userId: string, results: boolean[] }> {
      const user = request.user;
      const userId = user && user._id;
      if (!userId) throw new Error('Not a logged in user.');
      const results = await operateArchivedAucItem(userId, itemIds, 'srem');
      return {userId, results};
    },

    async updateProjectRatio(req, {projectId, ratio}) {
      await new Promise(resolve => setTimeout(resolve, dummyThroughputDelay));

      const p = currentProjects.projects.find(p => p.id === projectId);
      if (!p) {
        throw new Error('Project not found');
      }
      p.ratio = ratio;
      return p;
    },
  },
};

async function collectAucItems(
  collected: Array<any>,
  rawReqParams: Object,
  count: number,
  inc: boolean,
  cursorOnStart: number,
  cursor: number,
  totalCount: number,
  fetchedItems: Array<any>,
  userId: string): Promise<{
  collected: Array<any>,
  nextCursor: number,
  prevCursor: number,
}> {
  const isEnoughCollected = collected.length >= count;
  const isRightReached = cursor >= totalCount;
  const isLeftReached = cursor < 0;

  if (isEnoughCollected || isRightReached || isLeftReached) {
    const nextCursor = isRightReached ? -1 :
      inc ? cursor : cursorOnStart + 1;
    const prevCursor = isLeftReached ? -1 :
      inc ? cursorOnStart - 1 : cursor;
    return {collected, nextCursor, prevCursor,};
  }

  const cursorInItems = cursor % AUC_LIST_PER_PAGE;
  const cursoredItem = fetchedItems[cursorInItems];

  if (!cursoredItem) throw new Error('Never');

  const isArchivedItem = userId && await isArchivedAucItem(userId, cursoredItem.id);

  if (!isArchivedItem) collected.push(cursoredItem);

  const nextCursor = cursor + (inc ? 1 : -1);
  const shouldFlip = nextCursor % AUC_LIST_PER_PAGE === 0;

  if (shouldFlip) {
    const firstInPage = getFirstIndexInPage(nextCursor);
    const {totalCount, items} = await requestAucItemList(rawReqParams, firstInPage);
    return collectAucItems(collected, rawReqParams, count, inc, cursorOnStart, nextCursor, totalCount, items, userId);
  }

  return collectAucItems(collected, rawReqParams, count, inc, cursorOnStart, nextCursor, totalCount, fetchedItems, userId);
}

async function requestAucItemList(rawReqParams, from): Promise<AucItemList> {
  const stringifiedParams = qsStringify(rawReqParams);
  const totalCountCacheKey = `total:${stringifiedParams}`;
  const pageCacheKey = `page:${stringifiedParams}${from}`;

  const cachedTotalCount = cache.get(totalCountCacheKey);
  if (typeof cachedTotalCount === 'number' && cachedTotalCount < from) {
    // Being requested over search result
    return {
      totalCount: cachedTotalCount,
      items: [],
    };
  }

  if (cache.has(pageCacheKey)) {
    return (cache.get(pageCacheKey): AucItemList);
  }

  const url = makeURL('https://auctions.yahoo.co.jp/search/search', {
    ...rawReqParams,
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
    window: {document},
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

  const resolvedValue = {totalCount, items};
  cache.set(pageCacheKey, resolvedValue);
  cache.set(totalCountCacheKey, totalCount);

  return resolvedValue;
}

async function isArchivedAucItem(userId: string, itemId: string): Promise<boolean> {
  const [result] = await operateArchivedAucItem(userId, [itemId], 'sismember');
  return result;
}

async function operateArchivedAucItem(userId, itemIds, operation: 'sadd' | 'srem' | 'sismember'): Promise<boolean[]> {
  const key = getArchivedAucItemsKey(userId);
  const multi = persist.multi();
  if (typeof multi[operation] !== 'function') throw new Error();
  // const operate: Function = multi[operation].bind(multi);

  // [0, 1, ...]
  const results = await itemIds.reduce((multi, itemId) => {
    // $FlowFixMe
    return multi[operation](key, itemId);
  }, multi).execAsync();

  // [false, true, ...]
  return results.map(Boolean);
}

function getArchivedAucItemsKey(userId) {
  return `user:${userId}:archivedAucItems`;
}

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
  ...(__DEV__ ? {log: e => console.error(e.stack)} : {}),
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

function getFirstIndexInPage(from: number): number {
  return getPageIndex(from) * AUC_LIST_PER_PAGE;
}

function getPageIndex(from: number): number {
  return Math.floor(from / AUC_LIST_PER_PAGE);
}

