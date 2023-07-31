const {
  REACT_APP_PROJECT_ID: projectId = '',
  REACT_APP_API_URL: apiUrls = '',
  REACT_APP_HISTORY_URL: historyUrls = '',
  REACT_APP_REFERRAL_URL: referralUrls = '',
  REACT_APP_WEBSOCKET_URL: wsUrls = '',
  REACT_APP_CANDLES_WEBSOCKET_URL: candlesWsUrls = '',
  REACT_APP_PRICE_FEEDS: priceFeedEndpoints = '',
  REACT_APP_HTTP_RPC: httpRPCs = '',
} = process.env;

const URLS_SEPARATOR = ';';
const KEY_VALUE_SEPARATOR = '::';

function parseUrls(urlData: string): Record<string, string> {
  if (!urlData) {
    return {};
  }
  const urls: Record<string, string> = {};
  urlData.split(URLS_SEPARATOR).forEach((urlEntry) => {
    const parsedUrl = urlEntry.split(KEY_VALUE_SEPARATOR);
    urls[parsedUrl[0]] = parsedUrl[1];
  });
  return urls;
}

export const config = {
  projectId: projectId,
  apiUrl: parseUrls(apiUrls),
  historyUrl: parseUrls(historyUrls),
  referralUrl: parseUrls(referralUrls),
  wsUrl: parseUrls(wsUrls),
  candlesWsUrl: parseUrls(candlesWsUrls),
  priceFeedEndpoint: parseUrls(priceFeedEndpoints),
  httpRPC: parseUrls(httpRPCs),
};
