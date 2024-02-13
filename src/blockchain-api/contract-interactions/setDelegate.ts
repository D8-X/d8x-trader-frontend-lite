import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import type { Address, WalletClient } from 'viem';

export async function setDelegate(
  walletClient: WalletClient,
  proxyAddr: Address,
  delegateAddr: Address
): Promise<{ hash: Address }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: proxyAddr as Address,
      abi: PROXY_ABI,
      functionName: 'setDelegate',
      args: [delegateAddr],
      gasPrice: gasPrice,
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
