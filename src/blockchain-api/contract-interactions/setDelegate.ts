import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import type { Address, EstimateContractGasParameters, WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
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
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'setDelegate',
    args: [delegateAddr, delegateIndex],
    ...feesPerGas,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    ...estimateParams,
    account,
    chain: walletClient.chain,
    gas: gasLimit,
  };
  await walletClient.writeContract(baseParams);
  return delegateAddr;
}
