const {
  VITE_PROJECT_ID: projectId = '',
  VITE_WEB3AUTH_CLIENT_ID: web3AuthClientId = '',
  VITE_AUTH0_CLIENT_ID: auth0ClientId = '',
  VITE_WEB3AUTH_VERIFIER: web3AuthVerifier = '',
  VITE_GEONAMES_USERNAME: geonamesUsername = '',
  VITE_IP_GEOLOCATION_API_KEY: ipGeolocationApiKey = '',
  VITE_API_URL: apiUrls = '',
  VITE_HISTORY_URL: historyUrls = '',
  VITE_REFERRAL_URL: referralUrls = '',
  VITE_WEBSOCKET_URL: wsUrls = '',
  VITE_CANDLES_WEBSOCKET_URL: candlesWsUrls = '',
  VITE_PRICE_FEEDS: priceFeedEndpoints = '',
  VITE_HTTP_RPC: httpRPCs = '',
  VITE_ENABLED_CHAINS: enabledChains = '',
  VITE_ACTIVATE_LIFI: activateLiFi = 'true',
  VITE_WELCOME_MODAL: showChallengeModal = 'false',
  VITE_FIREBASE_APIKEY: firebaseApiKey = '',
  VITE_FIREBASE_AUTHDOMAIN: firebaseAuthDomain = '',
  VITE_FIREBASE_PROJECTID: firebaseProjectId = '',
  VITE_FIREBASE_STORAGEBUCKET: firebaseStorageBucket = '',
  VITE_FIREBASE_MESSAGINGSENDERID: firebaseMessengerId = '',
  VITE_FIREBASE_APPID: firebaseAppId = '',
  VITE_FIREBASE_MEASUREMENTID: firebaseMeasurementId = '',
} = import.meta.env;

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

function splitNumbers(numbers: string): number[] {
  if (!numbers) {
    return [];
  }
  return numbers.split(URLS_SEPARATOR).map(Number);
}

export const config = {
  projectId,
  web3AuthClientId,
  web3AuthVerifier,
  auth0ClientId,
  geonamesUsername,
  ipGeolocationApiKey,
  apiUrl: parseUrls(apiUrls),
  historyUrl: parseUrls(historyUrls),
  referralUrl: parseUrls(referralUrls),
  wsUrl: parseUrls(wsUrls),
  candlesWsUrl: parseUrls(candlesWsUrls),
  priceFeedEndpoint: parseUrls(priceFeedEndpoints),
  httpRPC: parseUrls(httpRPCs),
  enabledChains: splitNumbers(enabledChains),
  activateLiFi: activateLiFi === 'true',
  showChallengeModal: showChallengeModal === 'true',
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessengerId,
  firebaseAppId,
  firebaseMeasurementId,
};
