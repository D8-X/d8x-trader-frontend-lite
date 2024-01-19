import { PROXY_ABI, type TraderInterface, floatToDecN } from '@d8x/perpetuals-sdk';
import { type Address, type WalletClient } from 'viem';

export async function addLiquidity(
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
  const amountParsed = BigInt(floatToDecN(amount, decimals).toString());
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: traderAPI.getProxyAddress() as Address,
      abi: PROXY_ABI,
      functionName: 'addLiquidity',
      args: [poolId, amountParsed],
      account: account,
      gas: 400_000n + 200_000n * BigInt(traderAPI.getPerpetualSymbolsInPool(symbol).length),
    })
    .then((tx) => ({ hash: tx }));
}
