import { Chain, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { coinbaseWallet, injectedWallet, metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { configureChains, createClient } from 'wagmi';
import { polygonMumbai, polygon, polygonZkEvm, polygonZkEvmTestnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

import polygonMainIcon from 'assets/networks/polygonMain.svg';
import polygonTestIcon from 'assets/networks/polygonTest.svg';
import zkMainIcon from 'assets/networks/zkEvmMain.svg';
import zkTestIcon from 'assets/networks/zkEvmTest.svg';

const defaultChains: Chain[] = [
  { ...polygon, iconUrl: polygonMainIcon, iconBackground: 'transparent' },
  { ...polygonMumbai, iconUrl: polygonTestIcon, iconBackground: 'transparent' },
  { ...polygonZkEvm, iconUrl: zkMainIcon, iconBackground: 'transparent' },
  { ...polygonZkEvmTestnet, iconUrl: zkTestIcon, iconBackground: 'transparent' },
];

const { chains, provider } = configureChains(defaultChains, [publicProvider()]);

const projectId = 'eaff775af64a83b1564223ce858cb56c';

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
