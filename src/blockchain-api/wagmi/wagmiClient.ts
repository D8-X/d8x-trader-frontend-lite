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
import {
  polygon,
  polygonMumbai,
  polygonZkEvm,
  arbitrumSepolia,
  arbitrum,
  mainnet,
  optimism,
  bsc,
  base,
  zkSync,
  avalanche,
  aurora,
  linea,
  gnosis,
  fantom,
  moonriver,
  moonbeam,
  fuse,
  boba,
  metis,
  mode,
  scroll,
} from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { createClient } from 'viem';

import polygonIcon from 'assets/networks/polygon.webp';
import arbitrumIcon from 'assets/networks/arbitrum.png';
import x1Icon from 'assets/networks/x1.png';
import berachainIcon from 'assets/networks/berachain.png';
import { config } from 'config';
import { x1, cardona, artio, xlayer } from 'utils/chains';

const chains = [
  { ...polygonZkEvm, iconUrl: polygonIcon, iconBackground: 'transparent' } as Chain,
  { ...polygonMumbai, iconUrl: polygonIcon, iconBackground: 'transparent' },
  { ...x1, iconUrl: x1Icon, iconBackground: 'transparent' },
  { ...xlayer, iconUrl: x1Icon, iconBackground: 'transparent' },
  { ...cardona, iconUrl: polygonIcon, iconBackground: 'transparent' },
  { ...artio, iconUrl: berachainIcon, iconBackground: 'transparent' },
  {
    ...arbitrumSepolia,
    iconUrl: arbitrumIcon,
    iconBackground: 'transparent',
    blockExplorers: {
      default: {
        name: 'Arbiscan',
        url: 'https://sepolia.arbiscan.io/',
      },
    },
  },
  {
    ...arbitrum,
    iconUrl: arbitrumIcon,
    iconBackground: 'transparent',
    blockExplorers: {
      default: {
        name: 'Arbiscan',
        url: 'https://arbiscan.io/',
      },
    },
  },
  // LiFi specific chains
  { ...mainnet },
  { ...optimism },
  { ...polygon },
  { ...bsc },
  { ...zkSync },
  { ...base },
  { ...avalanche },
  { ...aurora },
  { ...linea },
  { ...gnosis },
  { ...fantom },
  { ...moonriver },
  { ...moonbeam },
  { ...fuse },
  { ...boba },
  { ...metis },
  { ...mode },
  { ...scroll },
].sort(({ id: id1 }, { id: id2 }) => config.enabledChains.indexOf(id1) - config.enabledChains.indexOf(id2)) as [
  Chain,
  ...Chain[],
];

const projectId = config.projectId;

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, rabbyWallet, walletConnectWallet],
    },
    {
      groupName: 'Others',
      wallets: [phantomWallet, coinbaseWallet, okxWallet, rainbowWallet],
    },
  ],
  { projectId, appName: 'D8X App' }
);

const wagmiConfig = createConfig({
  chains,
  connectors,
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});

export { chains, wagmiConfig };
