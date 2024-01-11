export interface PoolI {
  id: number;
  marginToken: string;
  decimals: number;
  marginTokenAddress: string;
  marginTokenSwap: string;
}

export interface ConfigI {
  chainId: number;
  pools: PoolI[];
}
