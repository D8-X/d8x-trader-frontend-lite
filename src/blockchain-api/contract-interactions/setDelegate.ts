import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import type { Address, WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

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
  const params = {
    chain: walletClient.chain,
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'setDelegate',
    args: [delegateAddr, delegateIndex],
    gasPrice: gasPrice,
    account,
  };
  const gasLimit = await estimateContractGas(walletClient, params)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => 4_000_000n);
  await walletClient.writeContract({ ...params, gas: gasLimit });
  return delegateAddr;
}
