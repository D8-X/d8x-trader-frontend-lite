import { PROXY_ABI, TraderInterface, floatToDec18 } from '@d8x/perpetuals-sdk';
import { AddressT } from 'types/types';
import { WalletClient } from 'viem';

export async function initiateLiquidityWithdrawal(
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  symbol: string,
  amount: number
): Promise<{ hash: AddressT }> {
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
      address: traderAPI.getProxyAddress() as AddressT,
      abi: PROXY_ABI,
      functionName: 'withdrawLiquidity',
      args: [poolId, amountParsed],
      gas: BigInt(2_000_000),
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
