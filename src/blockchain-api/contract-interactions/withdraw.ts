import { floatToDec18, PROXY_ABI, TraderInterface } from '@d8x/perpetuals-sdk';
import type { Address, WalletClient, WriteContractParameters } from 'viem';

import type { CollateralChangePropsI } from 'types/types';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';

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
  const params: WriteContractParameters = {
    chain: walletClient.chain,
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
    gasPrice: gasPrice,
    value: BigInt(pxUpdate.submission.timestamps.length * traderAPI.PRICE_UPDATE_FEE_GWEI),
    account: walletClient.account,
  };
  const gasLimit = await estimateContractGas(walletClient, params)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
  return walletClient.writeContract({ ...params, gas: gasLimit }).then((tx) => ({ hash: tx }));
}
