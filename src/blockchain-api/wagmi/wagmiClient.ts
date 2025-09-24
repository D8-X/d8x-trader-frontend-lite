import { createConfig } from '@privy-io/wagmi';
import { Chain } from '@rainbow-me/rainbowkit';
import { Transport } from 'viem';
import { http } from 'wagmi';
import { arbitrum, arbitrumSepolia, base, polygonZkEvm } from 'wagmi/chains';

import arbitrumIcon from 'assets/networks/arbitrum.png';
import berachainIcon from 'assets/networks/berachain.png';
import polygonIcon from 'assets/networks/polygon.webp';
import x1Icon from 'assets/networks/x1.png';
import { config } from 'config';
import { bartio, berachain, cardona, x1, xlayer } from 'utils/chains';

const chains = [
  { ...polygonZkEvm, iconUrl: polygonIcon, iconBackground: 'transparent' } as Chain,
  { ...x1, iconUrl: x1Icon, iconBackground: 'transparent' },
  { ...xlayer, iconUrl: x1Icon, iconBackground: 'transparent' },
  { ...cardona, iconUrl: polygonIcon, iconBackground: 'transparent' },
  { ...berachain, iconUrl: berachainIcon, iconBackground: 'transparent' },
  { ...bartio, iconUrl: berachainIcon, iconBackground: 'transparent' },
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
  {
    ...base,
    blockExplorers: {
      default: {
        name: 'Base Blockscout',
        url: '	https://base.blockscout.com/',
      },
    },
  },
]
  .filter((chain) => config.enabledChains.includes(chain.id))
  .sort(({ id: id1 }, { id: id2 }) => {
    const index1 = config.enabledChains.indexOf(id1);
    const index2 = config.enabledChains.indexOf(id2);

    if (index1 !== -1 && index2 !== -1) {
      // Both ids are in enabledChains, sort by their order in enabledChains
      return index1 - index2;
    } else if (index1 !== -1) {
      // Only id1 is in enabledChains, it should come first
      return -1;
    } else if (index2 !== -1) {
      // Only id2 is in enabledChains, it should come first
      return 1;
    } else {
      // Neither id is in enabledChains, maintain original order
      return 0;
    }
  }) as [Chain, ...Chain[]];

// const projectId = config.projectId;

// const connectors = connectorsForWallets(
//   [
//     {
//       groupName: 'Recommended',
//       wallets: [metaMaskWallet, rabbyWallet, walletConnectWallet, bybitWallet],
//     },
//     {
//       groupName: 'Others',
//       wallets: [phantomWallet, coinbaseWallet, okxWallet, rainbowWallet],
//     },
//   ],
//   { projectId, appName: 'D8X App' }
// );

const transports: Record<(typeof chains)[number]['id'], Transport> = {};

chains.map((chain) => (transports[chain.id] = http()));
console.log(transports);

const wagmiConfig = createConfig({
  chains,
  transports,
});

export { chains, wagmiConfig };
