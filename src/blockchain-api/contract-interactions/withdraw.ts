import { floatToDec18, PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { MethodE } from 'types/enums';
import type { CollateralChangePropsI } from 'types/types';

export async function withdraw(
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  { traderAddr, symbol, amount }: CollateralChangePropsI
): Promise<{ hash: Address }> {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const pxUpdate = await traderAPI.fetchPriceSubmissionInfoForPerpetual(symbol);
  const gasPrice = await getGasPrice(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'withdraw',
    args: [
      traderAPI.getPerpetualStaticInfo(symbol).id,
      traderAddr,
      floatToDec18(amount), // dToken always has 18 dec
      pxUpdate.submission.priceFeedVaas,
      pxUpdate.submission.timestamps,
    ],
    gasPrice,
    value: BigInt(pxUpdate.submission.timestamps.length * traderAPI.PRICE_UPDATE_FEE_GWEI),
    account: walletClient.account,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  const writeParams: WriteContractParameters = {
    ...estimateParams,
    chain: walletClient.chain,
    account: walletClient.account,
    gas: gasLimit,
  };
  return walletClient.writeContract(writeParams).then((tx) => ({ hash: tx }));
}
