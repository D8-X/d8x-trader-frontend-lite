import { Chain } from 'wagmi/chains';

export const x1 = {
  id: 195,
  name: 'X Layer Testnet',
  // network: 'avalanche',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { http: ['https://testrpc.xlayer.tech'] },
    default: { http: ['https://testrpc.xlayer.tech'] },
  },
  blockExplorers: {
    etherscan: { name: 'OKLink', url: 'https://www.okx.com/explorer/xlayer-test' },
    default: { name: 'OKLink', url: 'https://www.okx.com/explorer/xlayer-test' },
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
  // network: 'cardona',
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

export const artio = {
  id: 80085,
  name: 'Berachain Artio',
  // network: 'Berachain Artio',
  nativeCurrency: {
    decimals: 18,
    name: 'BERA',
    symbol: 'BERA',
  },
  rpcUrls: {
    public: { http: ['https://rpc.ankr.com/berachain_testnet'] },
    default: { http: ['https://rpc.ankr.com/berachain_testnet'] },
  },
  blockExplorers: {
    etherscan: { name: 'Beratrail', url: 'https://artio.beratrail.io/' },
    default: { name: 'Beratrail', url: 'https://artio.beratrail.io/' },
  },
  contracts: {
    multicall3: {
      address: '0x9d1dB8253105b007DDDE65Ce262f701814B91125',
      blockCreated: 0,
    },
  },
} as const satisfies Chain;

export const xlayer = {
  id: 196,
  name: 'X Layer',
  // network: 'X Layer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { http: ['https://rpc.xlayer.tech'] },
    default: { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    etherscan: { name: 'OKX Explorer', url: 'https://www.okx.com/explorer/xlayer' },
    default: { name: 'OKX Explorer', url: 'https://www.okx.com/explorer/xlayer' },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 47416,
    },
  },
} as const satisfies Chain;
