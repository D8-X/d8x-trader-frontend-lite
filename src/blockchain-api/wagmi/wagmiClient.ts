import { Chain, getDefaultConfig } from '@rainbow-me/rainbowkit';
// import {
//   coinbaseWallet,
//   metaMaskWallet,
//   okxWallet,
//   phantomWallet,
//   rabbyWallet,
//   rainbowWallet,
//   walletConnectWallet,
// } from '@rainbow-me/rainbowkit/wallets';
// import { configureChains, createConfig } from 'wagmi';
import { polygonMumbai, polygonZkEvm, polygonZkEvmTestnet, arbitrumSepolia } from 'wagmi/chains';
// import { publicProvider } from 'wagmi/providers/public';
// import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import polygonTestIcon from 'assets/networks/polygonTest.chain.svg';
import zkMainIcon from 'assets/networks/zkEvmMain.chain.svg';
import zkTestIcon from 'assets/networks/zkEvmTest.chain.svg';
import arbitrumSepoliaIcon from 'assets/networks/arbitrumSepolia.chain.svg';
import { config } from 'config';
import x1Icon from 'assets/networks/x1.png';
import berachainIcon from 'assets/networks/berachain.svg';
import { x1, cardona, artio } from 'utils/chains';
// import { createConfig } from 'wagmi';

const chains = [
  { ...polygonZkEvm, iconUrl: zkMainIcon, iconBackground: 'transparent' } as Chain,
  { ...polygonMumbai, iconUrl: polygonTestIcon, iconBackground: 'transparent' },
  { ...polygonZkEvmTestnet, iconUrl: zkTestIcon, iconBackground: 'transparent' },
  { ...x1, iconUrl: x1Icon, iconBackground: 'transparent' },
  { ...cardona, iconUrl: zkTestIcon, iconBackground: 'transparent' },
  { ...artio, iconUrl: berachainIcon, iconBackground: 'transparent' },
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
  .sort(({ id: id1 }, { id: id2 }) => config.enabledChains.indexOf(id1) - config.enabledChains.indexOf(id2)) as [
  Chain,
  ...Chain[],
];

// const providers = [
//   jsonRpcProvider({
//     rpc: (chain) => (chain.id === 80001 ? { http: 'https://gateway.tenderly.co/public/polygon-mumbai' } : null),
//   }),
//   jsonRpcProvider({
//     rpc: (chain) => (chain.id === 80001 ? { http: 'https://rpc.ankr.com/polygon_mumbai' } : null),
//   }),
//   jsonRpcProvider({
//     rpc: (chain) => (chain.id === 80001 ? { http: 'https://rpc-mumbai.maticvigil.com' } : null),
//   }),
//   publicProvider(),
// ].concat(
//   defaultChains.map(({ id: chainId }: Chain) =>
//     jsonRpcProvider({
//       rpc: (chain) =>
//         chain.id === chainId && config.httpRPC[chainId] && config.httpRPC[chainId] !== ''
//           ? { http: config.httpRPC[chainId] }
//           : null,
//     })
//   )
// );

// const { chains, publicClient, webSocketPublicClient } = configureChains(defaultChains, [publicProvider()], {
//   stallTimeout: 5_000,
// });

const projectId = config.projectId;

// const connectors = connectorsForWallets([
//   {
//     groupName: 'Recommended',
//     wallets: [
//       metaMaskWallet({ projectId, chains }),
//       rabbyWallet({ chains }),
//       walletConnectWallet({ projectId, chains }),
//     ],
//   },
//   {
//     groupName: 'Others',
//     wallets: [
//       phantomWallet({ chains }),
//       coinbaseWallet({ appName: 'D8X App', chains }),
//       okxWallet({ projectId, chains }),
//       rainbowWallet({ projectId, chains }),
//     ],
//   },
// ]);

// const wagmiConfig = createConfig({
//   autoConnect: true,
//   connectors,
//   publicClient,
//   webSocketPublicClient,
// });

const wagmiConfig = getDefaultConfig({
  appName: 'D8X App',
  projectId,
  chains,
});

export { chains, wagmiConfig };
