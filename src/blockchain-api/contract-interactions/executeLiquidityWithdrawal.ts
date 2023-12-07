import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import type { Account, Address, Transport, WalletClient } from 'viem';
import type { Chain } from 'wagmi';

export async function executeLiquidityWithdrawal(
  walletClient: WalletClient<Transport, Chain, Account>,
  traderAPI: TraderInterface,
  symbol: string
): Promise<{ hash: Address }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  const account = walletClient.account?.address;
  if (!decimals || !poolId || !account) {
    throw new Error('undefined call parameters');
  }
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: traderAPI.getProxyAddress() as Address,
      abi: PROXY_ABI,
      functionName: 'executeLiquidityWithdrawal',
      args: [poolId, walletClient.account?.address],
      gas: BigInt(500_000),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
