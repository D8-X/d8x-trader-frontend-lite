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

console.log(connectors());

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [Web3AuthConnectorInstance(chains)], //chains.map((chain) => Web3AuthConnectorInstance(chain)),
  publicClient,
  webSocketPublicClient,
});

export { chains, wagmiConfig, publicClient };
