import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
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
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

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

  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'setDelegate',
    args: [delegateAddr, delegateIndex],
    account: account,
    chain: walletClient.chain,
    gas: gasLimit,
  };

  // Determine which transaction type to use
  if (feesPerGas && 'maxFeePerGas' in feesPerGas && 'maxPriorityFeePerGas' in feesPerGas) {
    // EIP-1559 transaction
    const eip1559Params: WriteContractParameters = {
      ...baseParams,
      maxFeePerGas: feesPerGas.maxFeePerGas,
      maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
    };

    await walletClient.writeContract(eip1559Params);
    return delegateAddr;
  } else {
    // Legacy transaction
    const legacyParams: WriteContractParameters = {
      ...baseParams,
      gasPrice,
    };

    await walletClient.writeContract(legacyParams);
    return delegateAddr;
  }
}
