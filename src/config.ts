const {
  VITE_PROJECT_ID: projectId = '',
  VITE_WEB3AUTH_CLIENT_ID: web3AuthClientId = '',
  VITE_WEB3AUTH_VERIFIER: web3AuthVerifier = '',
  VITE_WEB3AUTH_ENVIRONMENT: web3AuthNetwork = '',
  VITE_GEONAMES_USERNAME: geonamesUsername = '',
  VITE_IP_GEOLOCATION_API_KEY: ipGeolocationApiKey = '',
  VITE_API_URL: apiUrls = '',
  VITE_BROKER_URL: brokerUrls = '',
  VITE_HISTORY_URL: historyUrls = '',
  VITE_REFERRAL_URL: referralUrls = '',
  VITE_WEBSOCKET_URL: wsUrls = '',
  VITE_CANDLES_WEBSOCKET_URL: candlesWsUrls = '',
  VITE_PRICE_FEEDS: priceFeedEndpoints = '',
  VITE_HTTP_RPC: httpRPCs = '',
  VITE_ENABLED_CHAINS: enabledChains = '',
  VITE_ENABLED_REFER_PAGE: enabledReferPage = 'true',
  VITE_ENABLED_VAULT_PAGE: enabledVaultPage = 'true',
  VITE_ENABLED_BOOST_STATION_PAGE: enabledBoostStationPage = 'true',
  VITE_ENABLED_PORTFOLIO_PAGE: enabledPortfolioPage = 'true',
  VITE_ENABLED_STRATEGIES_PAGE_BY_CHAINS: enabledStrategiesPageByChains = '',
  VITE_DEFAULT_THEME: defaultTheme = 'light',
  VITE_ACTIVATE_LIFI: activateLiFi = 'true',
  VITE_DISABLED_LIFI_BY_CHAINS: disabledLifiByChains = '',
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
  geonamesUsername,
  ipGeolocationApiKey,
  apiUrl: parseUrls(apiUrls),
  brokerUrl: parseUrls(brokerUrls),
  historyUrl: parseUrls(historyUrls),
  referralUrl: parseUrls(referralUrls),
  wsUrl: parseUrls(wsUrls),
  candlesWsUrl: parseUrls(candlesWsUrls),
  priceFeedEndpoint: parseUrls(priceFeedEndpoints),
  httpRPC: parseUrls(httpRPCs),
  enabledChains: splitNumbers(enabledChains),
  activateLiFi: activateLiFi === 'true',
  disabledLiFiByChains: splitNumbers(disabledLifiByChains),
  showChallengeModal: showChallengeModal === 'true',
  defaultTheme,
};

export const pagesConfig = {
  enabledBoostStationPage: enabledBoostStationPage === 'true',
  enabledReferPage: enabledReferPage === 'true',
  enabledVaultPage: enabledVaultPage === 'true',
  enabledPortfolioPage: enabledPortfolioPage === 'true',
  enabledStrategiesPage: splitNumbers(enabledStrategiesPageByChains).length > 0,
  enabledStrategiesPageByChains: splitNumbers(enabledStrategiesPageByChains),
};

export const web3AuthConfig = {
  web3AuthClientId,
  web3AuthVerifier,
  web3AuthNetwork,
  isEnabled: web3AuthClientId !== '',
};

export const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessengerId,
  appId: firebaseAppId,
  measurementId: firebaseMeasurementId,
};
