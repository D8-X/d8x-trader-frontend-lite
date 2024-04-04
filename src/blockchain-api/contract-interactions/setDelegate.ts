import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import type { Address, WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

export async function setDelegate(
  walletClient: WalletClient,
  proxyAddr: Address,
  delegateAddr: Address,
  delegateIndex: number
): Promise<{ hash: Address }> {
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
    .then((gas) => (gas * 110n) / 100n)
    .catch(() => undefined);
  return walletClient.writeContract({ ...params, gas: gasLimit }).then((tx) => ({ hash: tx }));
}
