import { PROXY_ABI, type TraderInterface, floatToDec18 } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { type Address, type WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';

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
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const params = {
    chain: walletClient.chain,
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'withdrawLiquidity',
    args: [poolId, amountParsed],
    gasPrice: gasPrice,
    account: account,
  };
  const fallbackGasLimit = getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact });
  const gasLimit = await estimateContractGas(walletClient, params)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => fallbackGasLimit);
  return walletClient.writeContract({ ...params, gas: gasLimit }).then((tx) => ({ hash: tx }));
}
