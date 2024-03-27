import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getBalance } from '@wagmi/core';
import { PrivateKeyAccount, type Address, type WalletClient } from 'viem';
import { estimateGas } from 'viem/actions';

import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';

export async function removeDelegate(
  walletClient: WalletClient,
  delegateAccount: PrivateKeyAccount,
  proxyAddr: Address
): Promise<{ hash: Address }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }
  // remove delegate
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const tx = await walletClient.writeContract({
    chain: walletClient.chain,
    address: proxyAddr as Address,
    abi: PROXY_ABI,
    functionName: 'removeDelegate',
    args: [],
    gasPrice: gasPrice,
    account: account,
  });
  // reclaim delegate funds
  if (account !== delegateAccount.address) {
    const { value: balance } = await getBalance(wagmiConfig, { address: delegateAccount.address });
    const gasLimit = await estimateGas(walletClient, {
      to: account,
      value: 1n,
      account: delegateAccount,
      gasPrice,
    }).catch(() => undefined);
    if (gasLimit && gasLimit * gasPrice < balance) {
      await walletClient.sendTransaction({
        to: account,
        value: balance - gasLimit * gasPrice,
        chain: walletClient.chain,
        gas: gasLimit,
        gasPrice,
        account: delegateAccount,
      });
    }
  }
  return { hash: tx };
}
