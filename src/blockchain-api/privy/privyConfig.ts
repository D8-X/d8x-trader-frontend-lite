import type { PrivyClientConfig } from '@privy-io/react-auth';
import { chains } from 'blockchain-api/chains';

// Replace this with your Privy config
export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    showWalletUIs: false,
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
  },
  loginMethods: ['twitter', 'email', 'sms', 'wallet'],
  supportedChains: chains,
  defaultChain: chains?.[0],
};
