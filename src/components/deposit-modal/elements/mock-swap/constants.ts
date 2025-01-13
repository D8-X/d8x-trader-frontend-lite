import { MockSwapConfigI } from 'types/types';

export const TOKEN_SWAPS: MockSwapConfigI[] = [
  {
    chainId: 195,
    pools: [
      {
        id: 1,
        marginToken: 'USDC',
        decimals: 6,
        marginTokenAddress: '0x2444BdA650cAAe90219aa15FEd3D195a6117579F',
        marginTokenSwap: '0x90EB9a579b001F49BBbf6B4B5e24CEF8CaF893f0',
      },
      // {
      //   id: 2,
      //   marginToken: 'OKB',
      //   decimals: 18,
      //   marginTokenAddress: '',
      //   marginTokenSwap: '0xD09DcF5A8e412B9892EbF65BacaEDc9BFEDCc828',
      // },
    ],
  },
  {
    chainId: 1442,
    pools: [
      {
        id: 1,
        marginToken: 'MATIC',
        decimals: 18,
        marginTokenAddress: '0xdCCe020d852f81eEc03B7577b636C8a85c6E5eeF',
        marginTokenSwap: '0xe222E37f87E658a50FC776c60ab036D630808fF9',
      },
      {
        id: 2,
        marginToken: 'USDC',
        decimals: 6,
        marginTokenAddress: '0x37D97d1FFc09587EA9BDF88Ea77ec4aFAA911260',
        marginTokenSwap: '0x22e0859fAaBd81B833C127237eCFC3a8B8933B3f',
      },
    ],
  },
  {
    chainId: 2442,
    pools: [
      {
        id: 1,
        marginToken: 'USDC',
        decimals: 6,
        marginTokenAddress: '0xCE4B7508638848b88a529b4dF85737fadFe6865C',
        marginTokenSwap: '0x063eE97717683FC9cAA70247c8BB0359EfEdb9A2',
      },
    ],
  },
  {
    chainId: 80084,
    pools: [
      {
        id: 1,
        marginToken: 'USDC',
        decimals: 6,
        marginTokenAddress: '0xc3D7F1F91a77618C959f8114422af4b3d70b2B4C',
        marginTokenSwap: '0x55CdD2AebAb6bb2a8F901500A3eF2E56B5B8964e',
      },
    ],
  },
];

export const SWAP_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_mockTokenAddr', type: 'address' },
      { internalType: 'uint256', name: '_d18MaticToMockConversion', type: 'uint256' },
      { internalType: 'uint256', name: '_maxDailyMockTokenSwapAmount', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'BalanceWithdrawn',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'sender', type: 'address' },
    ],
    name: 'MockTokensReceived',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amountOut', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'poolBalance', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'sender', type: 'address' },
    ],
    name: 'MockTokensSwapped',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    inputs: [],
    name: 'd18MaticToMockConversion',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_amount', type: 'uint256' }],
    name: 'depositMockToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'getAmountToReceive',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'maxDailyMockTokenSwapAmount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mockTokenAddr',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'movingBalance',
    outputs: [
      { internalType: 'uint256', name: 'amountMockTkn', type: 'uint256' },
      { internalType: 'uint256', name: 'timestamp', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  { inputs: [], name: 'swapToMockToken', outputs: [], stateMutability: 'payable', type: 'function' },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { inputs: [], name: 'withdraw', outputs: [], stateMutability: 'nonpayable', type: 'function' },
] as const;

export const ZK_NATIVE_CONVERTER_ABI = [
  { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
  { inputs: [], name: 'NotValidAmount', type: 'error' },
  { inputs: [], name: 'NotValidOwner', type: 'error' },
  { inputs: [], name: 'NotValidSelector', type: 'error' },
  { inputs: [], name: 'NotValidSpender', type: 'error' },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'previousAdmin',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'newAdmin',
        type: 'address',
      },
    ],
    name: 'AdminChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'beacon',
        type: 'address',
      },
    ],
    name: 'BeaconUpgraded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Convert',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint8',
        name: 'version',
        type: 'uint8',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Migrate',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Paused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'Unpaused',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'Upgraded',
    type: 'event',
  },
  {
    inputs: [],
    name: 'bridge',
    outputs: [
      {
        internalType: 'contract IPolygonZkEVMBridge',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newAdmin', type: 'address' }],
    name: 'changeAdmin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'receiver', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes', name: 'permitData', type: 'bytes' },
    ],
    name: 'convert',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner_', type: 'address' },
      { internalType: 'address', name: 'admin_', type: 'address' },
      { internalType: 'address', name: 'bridge_', type: 'address' },
      { internalType: 'uint32', name: 'l1NetworkId_', type: 'uint32' },
      { internalType: 'address', name: 'l1EscrowProxy_', type: 'address' },
      { internalType: 'address', name: 'zkUSDCe_', type: 'address' },
      { internalType: 'address', name: 'zkBWUSDC_', type: 'address' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'l1Escrow',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'l1NetworkId',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'migrate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newImplementation', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'newImplementation', type: 'address' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'zkBWUSDC',
    outputs: [{ internalType: 'contract IUSDC', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'zkUSDCe',
    outputs: [{ internalType: 'contract IUSDC', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const ZK_NATIVE_CONVERTER_ADDRESS = '0xd4F3531Fc95572D9e7b9e9328D9FEaa8e8496054';

export const OLD_USDC_ADDRESS = '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035';
