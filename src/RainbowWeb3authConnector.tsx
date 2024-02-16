import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { Web3Auth } from '@web3auth/modal';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { OpenloginAdapter, OPENLOGIN_NETWORK } from '@web3auth/openlogin-adapter';
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base';
import { config } from 'config';

const name = 'Web3Auth';
const iconUrl = 'https://avatars.githubusercontent.com/u/2824157?s=280&v=4';
const clientId = config.web3AuthClientId;
const disabledMethods = [
  'google',
  'facebook',
  'reddit',
  'discord',
  'twitch',
  'apple',
  'line',
  'github',
  'kakao',
  'linkedin',
  'weibo',
  'wechat',
  'email_passwordless',
  'sms_passwordless',
];

//@ts-expect-error chains has the correct type
export const rainbowWeb3AuthConnector = ({ chains }) => {
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: '0x' + chains[0].id.toString(16),
    rpcTarget: chains[0].rpcUrls.default.http[0],
    displayName: chains[0].name,
    tickerName: chains[0].nativeCurrency?.name,
    ticker: chains[0].nativeCurrency?.symbol,
    blockExplorer: chains[0].blockExplorers?.default.url[0],
  } as const;

  // Create Web3Auth Instance
  const web3AuthInstance = new Web3Auth({
    clientId: clientId,
    chainConfig,
    web3AuthNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
  });

  const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
  const openloginAdapter = new OpenloginAdapter({
    privateKeyProvider,
    adapterSettings: {
      uxMode: 'popup',
      whiteLabel: {
        appName: 'D8X',
      },
      loginConfig: {
        jwt: {
          verifier: 'd8x-test', // Verifier name
          typeOfLogin: 'jwt',
          clientId: 'YwsAsnbGPju3zXfqayLgBbla85fSp56X', // Auth0 `Client ID`
        },
      },
    },
  });
  web3AuthInstance.configureAdapter(openloginAdapter);

  return {
    id: 'web3auth',
    name,
    iconUrl,
    iconBackground: '#fff',
    createConnector: () => {
      const connector = new Web3AuthConnector({
        chains: chains,
        options: {
          web3AuthInstance,
          modalConfig: {
            [WALLET_ADAPTERS.OPENLOGIN]: {
              label: 'Social Login',
              loginMethods: {
                twitter: {
                  name: 'twitter',
                  showOnModal: true,
                },
                ...disabledMethods
                  .map((n) => ({ name: n, showOnModal: false }))
                  .reduce((obj, item) => Object.assign(obj, { [item.name]: item }), {}),
              },
            },
          },
        },
      });
      return {
        connector,
      };
    },
    onConnect: () => {
      //
      console.log('connected');
    },
  };
};
