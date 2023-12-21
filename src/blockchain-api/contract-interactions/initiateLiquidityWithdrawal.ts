import { PROXY_ABI, type TraderInterface, floatToDec18 } from '@d8x/perpetuals-sdk';
import { type Address, type WalletClient } from 'viem';

export async function initiateLiquidityWithdrawal(
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  symbol: string,
  amount: number
): Promise<{ hash: Address }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  const account = walletClient.account?.address;
  if (!decimals || !poolId || !account) {
    throw new Error('undefined call parameters');
  }
  const amountParsed = BigInt(floatToDec18(amount).toString());
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: traderAPI.getProxyAddress() as Address,
      abi: PROXY_ABI,
      functionName: 'withdrawLiquidity',
      args: [poolId, amountParsed],
      gas: 400_000n + 120_000n * BigInt(traderAPI.getPerpetualSymbolsInPool(symbol).length),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
