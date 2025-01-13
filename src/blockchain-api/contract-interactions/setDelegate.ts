import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';

export async function setDelegate(
  walletClient: WalletClient,
  proxyAddr: Address,
  delegateAddr: Address,
  delegateIndex: number
): Promise<Address> {
  const account = walletClient.account;
  if (!account) {
    throw new Error('account not connected');
  }
  if (delegateIndex <= 0) {
    throw new Error('cannot ');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'setDelegate',
    args: [delegateAddr, delegateIndex],
    gasPrice,
    account,
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
  await walletClient.writeContract(writeParams);
  return delegateAddr;
}
