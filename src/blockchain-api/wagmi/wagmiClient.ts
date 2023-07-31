import { Chain, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { coinbaseWallet, injectedWallet, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createClient } from 'wagmi';
// import { polygonMumbai, polygonZkEvm, polygonZkEvmTestnet } from 'wagmi/chains';
import { polygonMumbai, polygonZkEvmTestnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import polygonTestIcon from 'assets/networks/polygonTest.svg';
// import zkMainIcon from 'assets/networks/zkEvmMain.svg';
import zkTestIcon from 'assets/networks/zkEvmTest.svg';
import { config } from 'config';

const defaultChains: Chain[] = [
  // { ...polygonZkEvm, iconUrl: zkMainIcon, iconBackground: 'transparent' },
  { ...polygonMumbai, iconUrl: polygonTestIcon, iconBackground: 'transparent' },
  { ...polygonZkEvmTestnet, iconUrl: zkTestIcon, iconBackground: 'transparent' },
];

const providers = [
  jsonRpcProvider({
    rpc: (chain) => (chain.id === 80001 ? { http: 'https://gateway.tenderly.co/public/polygon-mumbai' } : null),
    priority: 1,
  }),
  jsonRpcProvider({
    rpc: (chain) => (chain.id === 80001 ? { http: 'https://rpc.ankr.com/polygon_mumbai' } : null),
    priority: 2,
  }),
  jsonRpcProvider({
    rpc: (chain) => (chain.id === 80001 ? { http: 'https://rpc-mumbai.maticvigil.com' } : null),
    priority: 3,
  }),
  publicProvider({ priority: 4 }),
].concat(
  defaultChains.map(({ id: chainId }: Chain) =>
    jsonRpcProvider({
      rpc: (chain) =>
        chain.id === chainId && config.httpRPC[chainId] && config.httpRPC[chainId] !== ''
          ? { http: config.httpRPC[chainId] }
          : null,
      static: true,
      priority: 4,
    })
  )
);

const { chains, provider } = configureChains(defaultChains, providers, { stallTimeout: 5_000 });

const projectId = config.projectId;

const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId, chains }),
      walletConnectWallet({ projectId, chains }),
      coinbaseWallet({ chains, appName: 'D8X App' }),
    ],
  },
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export { chains, wagmiClient };
