import { Chain, connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  coinbaseWallet,
  metaMaskWallet,
  okxWallet,
  phantomWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createConfig } from 'wagmi';
import { polygonMumbai, polygonZkEvm, polygonZkEvmTestnet, arbitrumSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import polygonTestIcon from 'assets/networks/polygonTest.svg';
import zkMainIcon from 'assets/networks/zkEvmMain.svg';
import zkTestIcon from 'assets/networks/zkEvmTest.svg';
import arbitrumSepoliaIcon from 'assets/networks/arbitrumSepolia.svg';
import { config } from 'config';
import x1Icon from 'assets/networks/x1.png';
import { x1, cardona } from 'utils/chains';
import Web3AuthConnectorInstance from 'Web3AuthConnectorInstance';
import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK } from '@web3auth/base';
import { numberToHex } from 'viem';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

const defaultChains: Chain[] = [
  { ...polygonZkEvm, iconUrl: zkMainIcon, iconBackground: 'transparent' },
  { ...polygonMumbai, iconUrl: polygonTestIcon, iconBackground: 'transparent' },
  { ...polygonZkEvmTestnet, iconUrl: zkTestIcon, iconBackground: 'transparent' },
  { ...x1, iconUrl: x1Icon, iconBackground: 'transparent' },
  { ...cardona, iconUrl: zkTestIcon, iconBackground: 'transparent' },
  {
    ...arbitrumSepolia,
    iconUrl: arbitrumSepoliaIcon,
    iconBackground: 'transparent',
    blockExplorers: {
      default: {
        name: 'Arbiscan',
        url: 'https://sepolia.arbiscan.io/',
      },
    },
  },
]
  .filter(({ id }) => config.enabledChains.includes(id))
  .sort(({ id: id1 }, { id: id2 }) => config.enabledChains.indexOf(id1) - config.enabledChains.indexOf(id2));

const providers = [
  jsonRpcProvider({
    rpc: (chain) => (chain.id === 80001 ? { http: 'https://gateway.tenderly.co/public/polygon-mumbai' } : null),
  }),
  jsonRpcProvider({
    rpc: (chain) => (chain.id === 80001 ? { http: 'https://rpc.ankr.com/polygon_mumbai' } : null),
  }),
  jsonRpcProvider({
    rpc: (chain) => (chain.id === 80001 ? { http: 'https://rpc-mumbai.maticvigil.com' } : null),
  }),
  publicProvider(),
].concat(
  defaultChains.map(({ id: chainId }: Chain) =>
    jsonRpcProvider({
      rpc: (chain) =>
        chain.id === chainId && config.httpRPC[chainId] && config.httpRPC[chainId] !== ''
          ? { http: config.httpRPC[chainId] }
          : null,
    })
  )
);

const { chains, publicClient, webSocketPublicClient } = configureChains(defaultChains, providers, {
  stallTimeout: 5_000,
});

const projectId = config.projectId;

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      metaMaskWallet({ projectId, chains }),
      rabbyWallet({ chains }),
      walletConnectWallet({ projectId, chains }),
    ],
  },
  {
    groupName: 'Others',
    wallets: [
      phantomWallet({ chains }),
      coinbaseWallet({ appName: 'D8X App', chains }),
      okxWallet({ projectId, chains }),
      rainbowWallet({ projectId, chains }),
    ],
  },
]);

const chain = chains[0];
const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: numberToHex(chain.id),
  rpcTarget: chain.rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
  displayName: chain.name,
  tickerName: chain.nativeCurrency?.name,
  ticker: chain.nativeCurrency?.symbol,
  blockExplorer: chain.blockExplorers?.default.url[0] as string,
};

const web3AuthInstance = new Web3AuthNoModal({
  clientId: config.web3AuthClientId,
  web3AuthNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
  chainConfig,
});
const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [...connectors(), Web3AuthConnectorInstance(chains, web3AuthInstance, privateKeyProvider)], //chains.map((chain) => Web3AuthConnectorInstance(chain)),
  publicClient,
  webSocketPublicClient,
});

export { chains, wagmiConfig, publicClient, web3AuthInstance };
