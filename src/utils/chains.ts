import { Chain } from 'wagmi';

export const x1 = {
  id: 195,
  name: 'X1',
  network: 'avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'OKX',
    symbol: 'OKX',
  },
  rpcUrls: {
    public: { http: ['https://testrpc.x1.tech'] },
    default: { http: ['https://testrpc.x1.tech'] },
  },
  blockExplorers: {
    etherscan: { name: 'OKLink', url: 'https://www.oklink.com/x1-test' },
    default: { name: 'OKLink', url: 'https://www.oklink.com/x1-test' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 624344,
    },
  },
} as const satisfies Chain;

export const cardona = {
  id: 2442,
  name: 'Cardona',
  network: 'cardona',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.cardona.zkevm-rpc.com'] },
    default: { http: ['https://rpc.cardona.zkevm-rpc.com'] },
  },
  blockExplorers: {
    etherscan: { name: 'Cardona Explorer', url: 'https://explorer-ui.cardona.zkevm-rpc.com' },
    default: { name: 'Cardona Explorer', url: 'https://explorer-ui.cardona.zkevm-rpc.com' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 114091,
    },
  },
} as const satisfies Chain;
