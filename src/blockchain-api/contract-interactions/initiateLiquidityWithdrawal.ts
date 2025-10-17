import { floatToDec18, PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import { encodeFunctionData, type Address } from 'viem';

import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';

export async function initiateLiquidityWithdrawal(
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  symbol: string,
  amount: number
): Promise<{ hash: Address }> {
  const chainId = Number(traderAPI.chainId);
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  if (!decimals || !poolId) {
    throw new Error('undefined call parameters');
  }
  const amountParsed = BigInt(floatToDec18(amount).toString());

  const txData2 = encodeFunctionData({
    abi: PROXY_ABI,
    functionName: 'withdrawLiquidity',
    args: [poolId, amountParsed],
  });

  return sendTransaction(
    {
      chainId,
      to: traderAPI.getProxyAddress() as Address,
      data: txData2,
    },
    { sponsor: hasPaymaster(chainId) }
  );
}
