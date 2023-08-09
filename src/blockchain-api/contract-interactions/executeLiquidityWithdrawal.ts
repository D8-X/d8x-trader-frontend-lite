import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import type { Account, Transport, WalletClient } from 'viem';
import type { Chain } from 'wagmi';

import type { AddressT } from 'types/types';

export async function executeLiquidityWithdrawal(
  walletClient: WalletClient<Transport, Chain, Account>,
  traderAPI: TraderInterface,
  symbol: string
): Promise<{ hash: AddressT }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  const account = walletClient.account?.address;
  if (!decimals || !poolId || !account) {
    throw new Error('undefined call parameters');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: traderAPI.getProxyAddress() as AddressT,
      abi: PROXY_ABI,
      functionName: 'executeLiquidityWithdrawal',
      args: [poolId, walletClient.account?.address],
      gas: BigInt(2_000_000),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
