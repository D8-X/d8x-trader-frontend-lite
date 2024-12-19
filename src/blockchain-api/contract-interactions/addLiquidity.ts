import { PROXY_ABI, type TraderInterface, floatToDecN } from '@d8x/perpetuals-sdk';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { MethodE } from 'types/enums';

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
  const amountCC = await traderAPI.fetchCollateralToSettlementConversion(symbol).then((c2s) => amount / c2s);
  const amountParsed = BigInt(floatToDecN(amountCC, decimals).toString());
  const gasPrice = await getGasPrice(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'addLiquidity',
    args: [poolId, amountParsed],
    account,
    gasPrice: gasPrice,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  const writeParams: WriteContractParameters = {
    ...estimateParams,
    chain: walletClient.chain,
    account,
    gas: gasLimit,
  };
  return walletClient.writeContract(writeParams).then((tx) => ({ hash: tx }));
}
