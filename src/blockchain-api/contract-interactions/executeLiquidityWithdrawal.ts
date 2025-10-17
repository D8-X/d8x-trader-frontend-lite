import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import { encodeFunctionData, type Address } from 'viem';

import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';

export async function executeLiquidityWithdrawal(
  to: Address,
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  symbol: string
): Promise<{ hash: Address }> {
  const chainId = Number(traderAPI.chainId);
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  if (!decimals || !poolId) {
    throw new Error('undefined call parameters');
  }

  const txData2 = encodeFunctionData({
    abi: PROXY_ABI,
    functionName: 'executeLiquidityWithdrawal',
    args: [poolId, to],
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
