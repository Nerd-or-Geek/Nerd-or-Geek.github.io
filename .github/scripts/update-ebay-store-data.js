const fs = require('fs');
const path = require('path');

const required = ['EBAY_CLIENT_ID'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required GitHub secrets: ${missing.join(', ')}`);
}

if (process.env.EBAY_CLIENT_ID.includes('SBX') || process.env.EBAY_CLIENT_SECRET?.includes('SBX')) {
  throw new Error('Sandbox eBay keys detected. Live ebay.com listings require Production eBay application keys, not Sandbox keys.');
}

const findingEndpoint = 'https://svcs.ebay.com/services/search/FindingService/v1';
const tokenUrl = 'https://api.ebay.com/identity/v1/oauth2/token';
const browseSearchEndpoint = 'https://api.ebay.com/buy/browse/v1/item_summary/search';
const inventoryItemsEndpoint = 'https://api.ebay.com/sell/inventory/v1/inventory_item';
const inventoryOffersEndpoint = 'https://api.ebay.com/sell/inventory/v1/offer';
const outputPath = path.join('data', 'store-items.json');
const defaultStoreNames = ['Nerd-or-Geek', 'NerdOrGeek', 'nerd-or-geek'];
const allowEmptyStoreData = process.env.EBAY_ALLOW_EMPTY_STORE_DATA === 'true';
const maxTrustedListings = Number(process.env.EBAY_MAX_TRUSTED_LISTINGS || 100);
const defaultKeywords = [
  'raspberry pi',
  'pi zero',
  'gpio',
  'accessories',
  'quectel',
  'modem',
  'cellular',
  'speaker',
  'kit',
  'parts',
];

const storeNameCandidates = unique([
  process.env.EBAY_STORE_NAME,
  process.env.EBAY_SELLER_USERNAME,
  ...defaultStoreNames,
]);
const sellerCandidates = new Set(unique([
  process.env.EBAY_SELLER_USERNAME,
  process.env.EBAY_STORE_NAME,
  ...defaultStoreNames,
]).map(normalizeSeller));
const keywords = (process.env.EBAY_SEARCH_KEYWORDS || '')
  .split(',')
  .map(keyword => keyword.trim())
  .filter(Boolean);
let browseAccessToken = '';
let sellUserAccessToken = '';

function unique(values) {
  return values
    .filter(Boolean)
    .map(value => String(value).trim())
    .filter(Boolean)
    .filter((value, index, array) => array.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index);
}

function normalizeSeller(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function compactText(value) {
  return Array.isArray(value) ? value[0] : value;
}

function compactObject(value) {
  return Array.isArray(value) ? value[0] : value;
}

function formatMoney(money) {
  if (!money) return '';
  const value = compactText(money.value ?? money.__value__ ?? money);
  const currency = compactText(money.currency ?? money['@currencyId'] ?? money['@currencyID'] ?? 'USD');
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value ? `${value} ${currency}` : '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${value} ${currency}`;
  }
}

function formatFindingShipping(item) {
  const shippingInfo = compactObject(item.shippingInfo);
  const cost = compactObject(shippingInfo?.shippingServiceCost);
  if (!cost) return '';
  const value = Number(compactText(cost.__value__ ?? cost.value));
  if (Number.isFinite(value) && value === 0) return 'Free shipping';
  const formatted = formatMoney(cost);
  return formatted ? `${formatted} shipping` : '';
}

function formatBrowseShipping(item) {
  const option = item.shippingOptions?.[0];
  const cost = option?.shippingCost;
  if (!cost) return '';
  const value = Number(cost.value);
  if (Number.isFinite(value) && value === 0) return 'Free shipping';
  const formatted = formatMoney(cost);
  return formatted ? `${formatted} shipping` : '';
}

function inferCategory(title) {
  const normalized = title.toLowerCase();
  if (normalized.includes('raspberry') || normalized.includes('pi zero') || normalized.includes('gpio')) {
    return 'Raspberry Pi';
  }
  if (normalized.includes('cellular') || normalized.includes('modem') || normalized.includes('lte') || normalized.includes('5g') || normalized.includes('4g') || normalized.includes('quectel')) {
    return 'Cellular';
  }
  return 'Accessories';
}

function mapFindingItem(item) {
  const title = compactText(item.title) || '';
  const sellingStatus = compactObject(item.sellingStatus);
  const currentPrice = compactObject(sellingStatus?.currentPrice);
  const condition = compactObject(item.condition);
  const sellerInfo = compactObject(item.sellerInfo);

  return {
    title,
    price: formatMoney(currentPrice),
    image: compactText(item.galleryURL) || compactText(item.pictureURLLarge) || compactText(item.pictureURLSuperSize) || '',
    url: compactText(item.viewItemURL) || '',
    condition: compactText(condition?.conditionDisplayName) || '',
    shipping: formatFindingShipping(item),
    category: inferCategory(title),
    itemId: compactText(item.itemId) || '',
    seller: compactText(sellerInfo?.sellerUserName) || '',
  };
}

function mapBrowseItem(item) {
  const title = item.title || '';
  return {
    title,
    price: formatMoney(item.price),
    image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
    url: item.itemWebUrl || '',
    condition: item.condition || '',
    shipping: formatBrowseShipping(item),
    category: inferCategory(title),
    itemId: item.itemId || '',
    seller: item.seller?.username || item.seller?.userName || '',
  };
}

function mapInventoryOffer(offer, inventoryItem) {
  const title = inventoryItem.product?.title || offer.sku || '';
  const listingId = offer.listing?.listingId || '';
  return {
    title,
    price: formatMoney(offer.pricingSummary?.price),
    image: inventoryItem.product?.imageUrls?.[0] || '',
    url: listingId ? `https://www.ebay.com/itm/${listingId}` : '',
    condition: inventoryItem.condition || '',
    shipping: '',
    category: inferCategory(title),
    itemId: listingId,
    seller: process.env.EBAY_SELLER_USERNAME || process.env.EBAY_STORE_NAME || 'Nerd-or-Geek',
  };
}

function sellerMatches(item) {
  const seller = normalizeSeller(item.seller?.username || item.seller?.userName || item.seller || '');
  return Boolean(seller) && sellerCandidates.has(seller);
}

function addItem(itemMap, item, { requireSeller = true } = {}) {
  if (!item.title || !item.url) return;
  if (requireSeller && !sellerMatches(item)) {
    return;
  }
  const key = item.itemId || item.url;
  itemMap.set(key, item);
}

function listingCountLooksTrusted(count) {
  return count <= maxTrustedListings;
}

async function fetchFindingPage(storeName, pageNumber) {
  const requestUrl = new URL(findingEndpoint);
  requestUrl.searchParams.set('OPERATION-NAME', 'findItemsIneBayStores');
  requestUrl.searchParams.set('SERVICE-VERSION', '1.13.0');
  requestUrl.searchParams.set('SECURITY-APPNAME', process.env.EBAY_CLIENT_ID);
  requestUrl.searchParams.set('RESPONSE-DATA-FORMAT', 'JSON');
  requestUrl.searchParams.set('REST-PAYLOAD', '');
  requestUrl.searchParams.set('GLOBAL-ID', 'EBAY-US');
  requestUrl.searchParams.set('siteid', '0');
  requestUrl.searchParams.set('storeName', storeName);
  requestUrl.searchParams.set('paginationInput.entriesPerPage', '100');
  requestUrl.searchParams.set('paginationInput.pageNumber', String(pageNumber));
  requestUrl.searchParams.set('outputSelector(0)', 'SellerInfo');
  requestUrl.searchParams.set('outputSelector(1)', 'PictureURLLarge');
  requestUrl.searchParams.set('outputSelector(2)', 'PictureURLSuperSize');

  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error(`Finding API request failed for store "${storeName}": ${response.status} ${await response.text()}`);
  }
  return response.json();
}

async function fetchStoreItemsFromFinding() {
  const itemMap = new Map();
  const failures = [];
  const seenSellers = new Set();

  console.log(`Trying eBay store names: ${storeNameCandidates.join(', ')}`);
  for (const storeName of storeNameCandidates) {
    try {
      let pageNumber = 1;
      let totalPages = 1;

      do {
        const data = await fetchFindingPage(storeName, pageNumber);
        const response = compactObject(data.findItemsIneBayStoresResponse);
        const ack = compactText(response?.ack);
        if (ack !== 'Success' && ack !== 'Warning') {
          const errorMessage = compactText(compactObject(compactObject(response?.errorMessage)?.error)?.message) || 'unknown eBay Finding API error';
          throw new Error(errorMessage);
        }

        const searchResult = compactObject(response?.searchResult);
        const items = Array.isArray(searchResult?.item) ? searchResult.item : [];
        console.log(`Finding API store "${storeName}" page ${pageNumber} returned ${items.length} item(s).`);
        items.map(mapFindingItem).forEach(item => {
          if (item.seller) seenSellers.add(item.seller);
          addItem(itemMap, item);
        });

        const pagination = compactObject(response?.paginationOutput);
        totalPages = Number(compactText(pagination?.totalPages)) || 1;
        pageNumber += 1;
      } while (pageNumber <= totalPages);

      if (itemMap.size) {
        if (!listingCountLooksTrusted(itemMap.size)) {
          console.log(`Finding API returned ${itemMap.size} verified listings, which exceeds the trusted limit of ${maxTrustedListings}. Ignoring as likely untrusted data.`);
          return [];
        }
        console.log(`Loaded ${itemMap.size} verified listings from eBay store "${storeName}" using Finding API.`);
        return Array.from(itemMap.values());
      }

      failures.push(`${storeName}: no items returned`);
    } catch (error) {
      failures.push(`${storeName}: ${error.message}`);
    }
  }

  console.log(`Finding API did not return store items. Attempts: ${failures.join(' | ')}`);
  console.log(`Finding API seller usernames seen: ${Array.from(seenSellers).join(', ') || '(none)'}`);
  return [];
}

async function getBrowseToken() {
  if (browseAccessToken) return browseAccessToken;
  if (!process.env.EBAY_CLIENT_SECRET) return '';
  const basicAuth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`eBay OAuth token request failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  browseAccessToken = tokenData.access_token || '';
  return browseAccessToken;
}

async function getSellUserToken() {
  if (sellUserAccessToken) return sellUserAccessToken;
  if (process.env.EBAY_USER_ACCESS_TOKEN) {
    sellUserAccessToken = process.env.EBAY_USER_ACCESS_TOKEN;
    return sellUserAccessToken;
  }
  if (!process.env.EBAY_REFRESH_TOKEN || !process.env.EBAY_CLIENT_SECRET) {
    return '';
  }

  const basicAuth = Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.EBAY_REFRESH_TOKEN,
      scope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`eBay user token refresh failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  }

  const tokenData = await tokenResponse.json();
  sellUserAccessToken = tokenData.access_token || '';
  return sellUserAccessToken;
}

async function fetchInventoryJson(url) {
  const token = await getSellUserToken();
  if (!token) {
    throw new Error('EBAY_REFRESH_TOKEN or EBAY_USER_ACCESS_TOKEN is not set.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Language': 'en-US',
    },
  });

  if (!response.ok) {
    throw new Error(`eBay Inventory API request failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function fetchInventoryItems() {
  const itemMap = new Map();
  let offset = 0;
  let total = 0;

  do {
    const url = new URL(inventoryItemsEndpoint);
    url.searchParams.set('limit', '100');
    url.searchParams.set('offset', String(offset));
    const data = await fetchInventoryJson(url);
    const items = data.inventoryItems || [];
    console.log(`Inventory API items offset ${offset} returned ${items.length} item(s), total ${data.total || 0}.`);
    items.forEach(item => {
      if (item.sku) itemMap.set(item.sku, item);
    });
    total = Number(data.total) || 0;
    offset += items.length || 100;
  } while (offset < total && offset < 1000);

  return itemMap;
}

async function fetchOffersForSku(sku) {
  const url = new URL(inventoryOffersEndpoint);
  url.searchParams.set('sku', sku);
  url.searchParams.set('marketplace_id', 'EBAY_US');
  url.searchParams.set('limit', '100');
  url.searchParams.set('offset', '0');
  const data = await fetchInventoryJson(url);
  return data.offers || [];
}

async function fetchStoreItemsFromInventory() {
  const token = await getSellUserToken();
  if (!token) {
    console.log('Skipping Inventory API because EBAY_REFRESH_TOKEN or EBAY_USER_ACCESS_TOKEN is not set.');
    return [];
  }

  const inventoryItems = await fetchInventoryItems();
  const itemMap = new Map();

  for (const [sku, inventoryItem] of inventoryItems.entries()) {
    const offers = await fetchOffersForSku(sku);
    offers
      .filter(offer => offer.status === 'PUBLISHED' && offer.listing?.listingStatus === 'ACTIVE')
      .map(offer => mapInventoryOffer(offer, inventoryItem))
      .forEach(item => addItem(itemMap, item));
  }

  console.log(`Loaded ${itemMap.size} active listings using Sell Inventory API.`);
  return Array.from(itemMap.values());
}

async function searchBrowseItems({ keyword = ' ', offset = 0 }) {
  const searchUrl = new URL(browseSearchEndpoint);
  searchUrl.searchParams.set('q', keyword);
  searchUrl.searchParams.set('limit', '100');
  searchUrl.searchParams.set('offset', String(offset));
  searchUrl.searchParams.set('filter', `sellers:{${process.env.EBAY_SELLER_USERNAME}},buyingOptions:{FIXED_PRICE|AUCTION}`);

  const searchResponse = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${await getBrowseToken()}`,
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      Accept: 'application/json',
    },
  });

  if (!searchResponse.ok) {
    throw new Error(`eBay Browse API request failed for query "${keyword.trim() || '(blank)'}": ${searchResponse.status} ${await searchResponse.text()}`);
  }

  return searchResponse.json();
}

async function fetchStoreItemsFromBrowseAllSellerItems() {
  if (!process.env.EBAY_SELLER_USERNAME) {
    console.log('Skipping Browse API seller search because EBAY_SELLER_USERNAME is not set.');
    return [];
  }

  const token = await getBrowseToken();
  if (!token) {
    console.log('Skipping Browse API seller search because EBAY_CLIENT_SECRET is not set.');
    return [];
  }

  const itemMap = new Map();
  const seenSellers = new Set();
  let offset = 0;
  let total = 0;

  console.log(`Trying Browse API seller search for EBAY_SELLER_USERNAME with a blank query.`);
  try {
    do {
      const data = await searchBrowseItems({ keyword: ' ', offset });
      const items = data.itemSummaries || [];
      console.log(`Browse API seller search offset ${offset} returned ${items.length} item(s), total ${data.total || 0}.`);
      total = Number(data.total) || 0;
      if (!listingCountLooksTrusted(total)) {
        console.log(`Browse API seller search total ${total} exceeds the trusted limit of ${maxTrustedListings}. Ignoring as likely unfiltered marketplace data.`);
        return [];
      }
      items.map(mapBrowseItem).forEach(item => {
        if (item.seller) seenSellers.add(item.seller);
        addItem(itemMap, item);
      });
      offset += items.length || 100;
    } while (offset < total && offset < 1000);
  } catch (error) {
    console.log(`Browse API seller search failed: ${error.message}`);
    return [];
  }

  if (!listingCountLooksTrusted(itemMap.size)) {
    console.log(`Browse API seller search kept ${itemMap.size} listings, which exceeds the trusted limit of ${maxTrustedListings}. Ignoring as likely untrusted data.`);
    return [];
  }

  console.log(`Browse API seller usernames seen: ${Array.from(seenSellers).slice(0, 20).join(', ') || '(none)'}`);
  console.log(`Loaded ${itemMap.size} verified listings using Browse API seller search.`);
  return Array.from(itemMap.values());
}

async function fetchStoreItemsFromBrowseKeywords() {
  if (!process.env.EBAY_SELLER_USERNAME) {
    console.log('Skipping Browse API keyword fallback because EBAY_SELLER_USERNAME is not set.');
    return [];
  }

  const token = await getBrowseToken();
  if (!token) {
    console.log('Skipping Browse API keyword fallback because EBAY_CLIENT_SECRET is not set.');
    return [];
  }

  const itemMap = new Map();
  const seenSellers = new Set();
  const queryTerms = keywords.length ? keywords : defaultKeywords;
  console.log(`Trying Browse API fallback keywords: ${queryTerms.join(', ')}`);
  for (const keyword of queryTerms) {
    try {
      const data = await searchBrowseItems({ keyword, offset: 0 });
      const items = data.itemSummaries || [];
      console.log(`Browse API keyword "${keyword}" returned ${items.length} item(s), total ${data.total || 0}.`);
      items.map(mapBrowseItem).forEach(item => {
        if (item.seller) seenSellers.add(item.seller);
        addItem(itemMap, item);
      });
    } catch (error) {
      console.log(`Browse API keyword "${keyword}" failed: ${error.message}`);
    }
  }

  console.log(`Browse API keyword seller usernames seen: ${Array.from(seenSellers).slice(0, 20).join(', ') || '(none)'}`);
  if (!listingCountLooksTrusted(itemMap.size)) {
    console.log(`Browse API keyword fallback kept ${itemMap.size} listings, which exceeds the trusted limit of ${maxTrustedListings}. Ignoring as likely untrusted data.`);
    return [];
  }
  console.log(`Loaded ${itemMap.size} verified listings using Browse API keyword fallback.`);
  return Array.from(itemMap.values());
}

async function main() {
  let items = await fetchStoreItemsFromInventory();

  if (!items.length) {
    items = await fetchStoreItemsFromFinding();
  }

  if (!items.length) {
    items = await fetchStoreItemsFromBrowseKeywords();
  }

  if (!items.length && !allowEmptyStoreData) {
    throw new Error(
      'No eBay store listings were returned, so data/store-items.json was not overwritten. ' +
      'Check EBAY_STORE_NAME and EBAY_SELLER_USERNAME. Recommended values: EBAY_STORE_NAME=NerdOrGeek or Nerd-or-Geek, and EBAY_SELLER_USERNAME as the public seller username shown by eBay.'
    );
  }

  if (!listingCountLooksTrusted(items.length)) {
    throw new Error(`Refusing to write ${items.length} eBay listings because that exceeds EBAY_MAX_TRUSTED_LISTINGS=${maxTrustedListings}. This usually means eBay returned marketplace items that are not from your store.`);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(items, null, 2)}\n`);
  console.log(`Wrote ${items.length} store items to ${outputPath}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
