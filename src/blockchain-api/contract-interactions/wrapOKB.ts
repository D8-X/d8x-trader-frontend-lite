import {
  parseEther,
  parseUnits,
  type Address,
  type EstimateContractGasParameters,
  type WriteContractParameters,
} from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasPrice } from 'blockchain-api/getGasPrice';
import { WrapOKBConfigI } from 'types/types';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';

const abi = [
  {
    constant: false,
    inputs: [],
    name: 'deposit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [{ indexed: false, name: 'wad', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function wrapOKB({
  walletClient,
  wrappedTokenAddress,
  wrappedTokenDecimals,
  amountWrap,
  amountUnwrap,
}: WrapOKBConfigI): Promise<Address> {
  const account = walletClient.account;
  if (!account) {
    throw new Error('account not connected');
  }

  const gasPrice = await getGasPrice(walletClient.chain?.id);

  let estimateParams: EstimateContractGasParameters;
  if (amountWrap && amountWrap > 0) {
    estimateParams = {
      address: wrappedTokenAddress,
      functionName: 'deposit',
      gasPrice,
      account,
      value: parseEther(amountWrap.toString()),
      abi,
    };
  } else if (amountUnwrap && amountUnwrap > 0) {
    estimateParams = {
      address: wrappedTokenAddress,
      functionName: 'withdraw',
      args: [parseUnits(amountUnwrap.toString(), wrappedTokenDecimals)],
      gasPrice,
      account,
      abi,
    };
  } else {
    throw new Error('No amount to wrap/unwrap');
  }
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  const writeParams: WriteContractParameters = {
    ...estimateParams,
    chain: walletClient.chain,
    gas: gasLimit,
    account,
  };
  return walletClient.writeContract(writeParams);
}
