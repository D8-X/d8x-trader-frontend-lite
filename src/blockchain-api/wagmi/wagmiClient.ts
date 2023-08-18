import { Chain, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
// import { polygonMumbai, polygonZkEvm, polygonZkEvmTestnet } from 'wagmi/chains';
import { polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import polygonTestIcon from 'assets/networks/polygonTest.svg';
// import zkMainIcon from 'assets/networks/zkEvmMain.svg';
// import zkTestIcon from 'assets/networks/zkEvmTest.svg';
import { config } from 'config';

const defaultChains: Chain[] = [
  // { ...polygonZkEvm, iconUrl: zkMainIcon, iconBackground: 'transparent' },
  { ...polygonMumbai, iconUrl: polygonTestIcon, iconBackground: 'transparent' },
  // { ...polygonZkEvmTestnet, iconUrl: zkTestIcon, iconBackground: 'transparent' },
];

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

const { connectors } = getDefaultWallets({
  appName: 'D8X App',
  projectId: projectId,
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});

export { chains, wagmiConfig };
