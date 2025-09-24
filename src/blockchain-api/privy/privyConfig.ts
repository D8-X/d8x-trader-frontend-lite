import type { PrivyClientConfig } from '@privy-io/react-auth';

// Replace this with your Privy config
export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    showWalletUIs: false,
    ethereum: {
      createOnLogin: 'users-without-wallets',
    },
  },

  loginMethods: ['wallet', 'twitter', 'email', 'sms'],

  appearance: {
    showWalletLoginFirst: true,
  },
};
