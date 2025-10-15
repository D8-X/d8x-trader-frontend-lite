import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { encodeFunctionData, type Address } from 'viem';

export async function settleTrader(
  sendTransaction: SendTransactionCallT,
  traderAPI: TraderInterface,
  symbol: string,
  traderAddr: Address
): Promise<{ hash: Address }> {
  const chainId = Number(traderAPI.chainId);
  const perpetualId = traderAPI.getPerpIdFromSymbol(symbol);
  if (!perpetualId) {
    throw new Error('undefined call parameters');
  }

  const txData2 = encodeFunctionData({
    abi: PROXY_ABI,
    functionName: 'settle',
    args: [perpetualId, traderAddr],
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
