import type { PrivyClientConfig } from '@privy-io/react-auth';

// Replace this with your Privy config
export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
  },

  loginMethods: ['wallet', 'email', 'sms'],

  appearance: {
    showWalletLoginFirst: true,
  },
};
