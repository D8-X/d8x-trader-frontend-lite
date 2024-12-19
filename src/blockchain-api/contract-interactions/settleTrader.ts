import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';

export async function settleTrader(
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  symbol: string,
  traderAddr: Address
): Promise<{ hash: Address }> {
  const perpetualId = traderAPI.getPerpIdFromSymbol(symbol);
  const account = walletClient.account?.address;
  if (!perpetualId || !account) {
    throw new Error('undefined call parameters');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'settle',
    args: [perpetualId, traderAddr],
    account,
    gasPrice,
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
