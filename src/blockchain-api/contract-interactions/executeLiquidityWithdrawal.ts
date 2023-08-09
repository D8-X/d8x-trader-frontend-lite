import { PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import { AddressT } from 'types/types';
import { PublicClient, WalletClient } from 'viem';

export async function executeLiquidityWithdrawal(
  publicClient: PublicClient,
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  symbol: string
): Promise<{ hash: AddressT }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  if (decimals === undefined || poolId === undefined) {
    throw new Error('Pool not found');
  }
  return publicClient
    .simulateContract({
      address: traderAPI.getProxyAddress() as AddressT,
      abi: PROXY_ABI,
      functionName: 'executeLiquidityWithdrawal',
      args: [poolId, walletClient.account?.address],
      gas: BigInt(2_000_000),
      account: walletClient.account,
    })
    .then(({ request }) => walletClient.writeContract(request))
    .then((tx) => ({ hash: tx }));
}
