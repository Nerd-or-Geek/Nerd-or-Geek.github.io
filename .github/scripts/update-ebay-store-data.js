const fs = require('fs');
const path = require('path');

const required = ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_REFRESH_TOKEN'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing required GitHub secrets: ${missing.join(', ')}`);
}

if (process.env.EBAY_CLIENT_ID.includes('SBX') || process.env.EBAY_CLIENT_SECRET?.includes('SBX')) {
  throw new Error('Sandbox eBay keys detected. Live ebay.com listings require Production eBay application keys, not Sandbox keys.');
}

const tokenUrl = 'https://api.ebay.com/identity/v1/oauth2/token';
const inventoryItemsEndpoint = 'https://api.ebay.com/sell/inventory/v1/inventory_item';
const inventoryOffersEndpoint = 'https://api.ebay.com/sell/inventory/v1/offer';
const tradingEndpoint = 'https://api.ebay.com/ws/api.dll';
const outputPath = path.join('data', 'store-items.json');
const allowEmptyStoreData = process.env.EBAY_ALLOW_EMPTY_STORE_DATA === 'true';
const maxTrustedListings = Number(process.env.EBAY_MAX_TRUSTED_LISTINGS || 100);

const sellerCandidates = new Set(unique([
  process.env.EBAY_SELLER_USERNAME,
  process.env.EBAY_STORE_NAME,
  'Nerd-or-Geek',
  'NerdOrGeek',
  'nerd-or-geek',
]).map(normalizeSeller));
let sellUserAccessToken = '';
let tradingUserAccessToken = '';

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

function decodeXml(text = '') {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function escapeXml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getXmlText(xml, tagName) {
  const match = String(xml).match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : '';
}

function getXmlBlocks(xml, tagName) {
  return Array.from(String(xml).matchAll(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'gi'))).map(match => match[1]);
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

function mapTradingItem(itemXml) {
  const title = getXmlText(itemXml, 'Title');
  const itemId = getXmlText(itemXml, 'ItemID');
  const price = getXmlText(itemXml, 'CurrentPrice') || getXmlText(itemXml, 'BuyItNowPrice') || getXmlText(itemXml, 'StartPrice');
  const galleryUrl = getXmlText(itemXml, 'GalleryURL');
  const pictureDetails = getXmlText(itemXml, 'PictureDetails') ? itemXml.match(/<PictureDetails(?:\s[^>]*)?>([\s\S]*?)<\/PictureDetails>/i)?.[1] || '' : '';
  const image = galleryUrl || getXmlText(pictureDetails, 'PictureURL');
  return {
    title,
    price: price ? formatMoney({ value: price, currency: 'USD' }) : '',
    image,
    url: getXmlText(itemXml, 'ViewItemURL') || (itemId ? `https://www.ebay.com/itm/${itemId}` : ''),
    condition: getXmlText(itemXml, 'ConditionDisplayName'),
    shipping: '',
    category: inferCategory(title),
    itemId,
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

async function refreshUserAccessToken(scope, label) {
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
      scope,
    }),
  });

  if (!tokenResponse.ok) {
    const responseText = await tokenResponse.text();
    let hint = '';
    if (responseText.includes('invalid_grant')) {
      hint = '\nThe EBAY_REFRESH_TOKEN secret is invalid for this app. Generate a new Production user refresh token with the same EBAY_CLIENT_ID/EBAY_CLIENT_SECRET pair, then replace the GitHub secret.';
    }
    throw new Error(`eBay ${label} token refresh failed: ${tokenResponse.status} ${responseText}${hint}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token || '';
}

async function getSellUserToken() {
  if (sellUserAccessToken) return sellUserAccessToken;

  sellUserAccessToken = await refreshUserAccessToken(
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'sell.inventory'
  );
  return sellUserAccessToken;
}

async function getTradingUserToken() {
  if (tradingUserAccessToken) return tradingUserAccessToken;

  try {
    tradingUserAccessToken = await refreshUserAccessToken(
      'https://api.ebay.com/oauth/api_scope',
      'base-scope'
    );
    return tradingUserAccessToken;
  } catch (error) {
    console.log(error.message);
    tradingUserAccessToken = await getSellUserToken();
    return tradingUserAccessToken;
  }
}

async function fetchInventoryJson(url) {
  const token = await getSellUserToken();
  if (!token) {
    throw new Error('EBAY_REFRESH_TOKEN could not be exchanged for an eBay access token.');
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Accept-Language': 'en-US',
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    if (response.status === 401) {
      throw new Error(
        `eBay Inventory API request failed: ${response.status} ${responseText}\n` +
        'The Inventory API rejected the bearer token. Replace EBAY_REFRESH_TOKEN with a new Production refresh token generated from the same eBay app as EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.'
      );
    }
    throw new Error(`eBay Inventory API request failed: ${response.status} ${responseText}`);
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
    console.log('Skipping Inventory API because EBAY_REFRESH_TOKEN could not be exchanged.');
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

async function fetchTradingPage(pageNumber) {
  const token = await getTradingUserToken();
  if (!token) {
    console.log('Skipping Trading API because a base-scope OAuth token could not be created.');
    return '';
  }

  const requestXml = `<?xml version="1.0" encoding="utf-8"?>
<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${escapeXml(token)}</eBayAuthToken>
  </RequesterCredentials>
  <DetailLevel>ReturnAll</DetailLevel>
  <ErrorLanguage>en_US</ErrorLanguage>
  <Version>1451</Version>
  <ActiveList>
    <Include>true</Include>
    <Pagination>
      <EntriesPerPage>100</EntriesPerPage>
      <PageNumber>${pageNumber}</PageNumber>
    </Pagination>
  </ActiveList>
</GetMyeBaySellingRequest>`;

  const headers = {
    'Content-Type': 'text/xml',
    'X-EBAY-API-CALL-NAME': 'GetMyeBaySelling',
    'X-EBAY-API-SITEID': '0',
    'X-EBAY-API-COMPATIBILITY-LEVEL': '1451',
    'X-EBAY-API-IAF-TOKEN': token,
  };

  if (process.env.EBAY_DEV_ID) headers['X-EBAY-API-DEV-NAME'] = process.env.EBAY_DEV_ID;
  if (process.env.EBAY_CLIENT_ID) headers['X-EBAY-API-APP-NAME'] = process.env.EBAY_CLIENT_ID;
  if (process.env.EBAY_CLIENT_SECRET) headers['X-EBAY-API-CERT-NAME'] = process.env.EBAY_CLIENT_SECRET;

  const response = await fetch(tradingEndpoint, {
    method: 'POST',
    headers,
    body: requestXml,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(`eBay Trading API request failed: ${response.status} ${responseText}`);
  }
  return responseText;
}

async function fetchStoreItemsFromTrading() {
  const itemMap = new Map();
  let pageNumber = 1;
  let totalPages = 1;

  do {
    const xml = await fetchTradingPage(pageNumber);
    if (!xml) return [];

    const ack = getXmlText(xml, 'Ack');
    if (ack !== 'Success' && ack !== 'Warning') {
      const message = getXmlText(xml, 'LongMessage') || getXmlText(xml, 'ShortMessage') || 'unknown Trading API error';
      console.log(`Trading API did not return active listings: ${message}`);
      return [];
    }

    const activeList = xml.match(/<ActiveList(?:\s[^>]*)?>([\s\S]*?)<\/ActiveList>/i)?.[1] || '';
    const items = getXmlBlocks(activeList, 'Item');
    console.log(`Trading API active listings page ${pageNumber} returned ${items.length} item(s).`);
    items.map(mapTradingItem).forEach(item => addItem(itemMap, item));

    const pagination = activeList.match(/<PaginationResult(?:\s[^>]*)?>([\s\S]*?)<\/PaginationResult>/i)?.[1] || '';
    totalPages = Number(getXmlText(pagination, 'TotalNumberOfPages')) || 1;
    pageNumber += 1;
  } while (pageNumber <= totalPages && pageNumber <= 10);

  console.log(`Loaded ${itemMap.size} active listings using Trading API.`);
  return Array.from(itemMap.values());
}

async function main() {
  let items = await fetchStoreItemsFromInventory();

  if (!items.length) {
    items = await fetchStoreItemsFromTrading();
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
