import { parseEther, parseUnits, type Address } from 'viem';
import { estimateContractGas } from 'viem/actions';
import { WriteContractParameters } from '@wagmi/core';

import { getGasPrice } from 'blockchain-api/getGasPrice';
import { WrapOKBConfigI } from 'types/types';

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

  let params: WriteContractParameters;

  if (amountWrap && amountWrap > 0) {
    params = {
      chainId: walletClient.chain?.id,
      address: wrappedTokenAddress,
      functionName: 'deposit',
      gasPrice: gasPrice,
      account,
      value: parseEther(amountWrap.toString()),
      abi,
    };
  } else if (amountUnwrap && amountUnwrap > 0) {
    params = {
      chainId: walletClient.chain?.id,
      address: wrappedTokenAddress,
      functionName: 'withdraw',
      args: [parseUnits(amountUnwrap.toString(), wrappedTokenDecimals)],
      gasPrice: gasPrice,
      account,
      abi,
    };
  } else {
    throw new Error('No amount to wrap/unwrap');
  }

  const gasLimit = await estimateContractGas(walletClient, params)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => 4_000_000n);
  return walletClient.writeContract({ ...params, account, chain: walletClient.chain, gas: gasLimit });
}
