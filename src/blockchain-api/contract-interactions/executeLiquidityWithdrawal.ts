import { PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { AddressT } from 'types/types';
import { WalletClient } from 'viem';

export async function executeLiquidityWithdrawal(
  walletClient: WalletClient,
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
