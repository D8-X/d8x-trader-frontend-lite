import { PROXY_ABI, TraderInterface, floatToDec18 } from '@d8x/perpetuals-sdk';
import { AddressT } from 'types/types';
import { PublicClient, WalletClient } from 'viem';

export async function initiateLiquidityWithdrawal(
  publicClient: PublicClient,
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  symbol: string,
  amount: number
): Promise<{ hash: AddressT }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  if (decimals === undefined || poolId === undefined) {
    throw new Error('Pool not found');
  }
  const amountParsed = BigInt(floatToDec18(amount).toString());
  return publicClient
    .simulateContract({
      address: traderAPI.getProxyAddress() as AddressT,
      abi: PROXY_ABI,
      functionName: 'withdrawLiquidity',
      args: [poolId, amountParsed],
      gas: BigInt(2_000_000),
      account: walletClient.account,
    })
    .then(({ request }) => walletClient.writeContract(request))
    .then((tx) => ({ hash: tx }));
}
