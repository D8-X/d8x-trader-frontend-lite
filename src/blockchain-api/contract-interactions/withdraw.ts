import { floatToABK64x64, PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Address, EstimateContractGasParameters, WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { getGasLimit } from 'blockchain-api/getGasLimit';

import { SmartAccountClient } from 'permissionless';
import { MethodE } from 'types/enums';
import type { CollateralChangePropsI } from 'types/types';
import { updatePyth } from './updatePyth';

export async function withdraw(
  walletClient: WalletClient | SmartAccountClient,
  traderAPI: TraderInterface,
  { traderAddr, symbol, amount }: CollateralChangePropsI
): Promise<{ hash: Address }> {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  const pxUpdate = await traderAPI.fetchPriceSubmissionInfoForPerpetual(symbol);
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  await updatePyth({
    walletClient,
    priceData: {
      updateData: pxUpdate.submission.priceFeedVaas,
      ids: pxUpdate.submission.ids,
      publishTimes: pxUpdate.submission.timestamps,
      updateFee: pxUpdate.submission.ids.length,
    },
    feesPerGas,
  });

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'withdraw',
    args: [
      traderAPI.getPerpetualStaticInfo(symbol).id,
      traderAddr,
      floatToABK64x64(amount),
      [], //pxUpdate.submission.priceFeedVaas,
      [], //pxUpdate.submission.timestamps,
    ],
    // value: BigInt(pxUpdate.submission.timestamps.length * traderAPI.PRICE_UPDATE_FEE_GWEI),
    account: walletClient.account,
    ...feesPerGas,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
  const baseParams = {
    ...estimateParams,
    account: walletClient.account || null,
    chain: walletClient.chain,
    gas: gasLimit,
  };
  return walletClient.writeContract(baseParams).then((tx) => ({ hash: tx }));
}
