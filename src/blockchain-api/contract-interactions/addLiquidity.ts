import { floatToDecN, PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import { encodeFunctionData, type Address } from 'viem';

import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';

export async function addLiquidity(
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  symbol: string,
  amount: number
): Promise<{ hash: Address }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  if (!decimals || !poolId) {
    throw new Error('undefined call parameters');
  }
  const chainId = Number(traderAPI.chainId);
  const amountCC = await traderAPI.fetchCollateralToSettlementConversion(symbol).then((c2s) => amount / c2s);
  const amountParsed = BigInt(floatToDecN(amountCC, decimals).toString());

  const txData2 = encodeFunctionData({
    abi: PROXY_ABI,
    functionName: 'addLiquidity',
    args: [poolId, amountParsed],
  });

  return sendTransaction(
    {
      chainId,
      to: traderAPI.getProxyAddress() as Address,
      data: txData2,
      gasLimit: 1_000_000n,
    },
    { sponsor: hasPaymaster(chainId) }
  );
}
