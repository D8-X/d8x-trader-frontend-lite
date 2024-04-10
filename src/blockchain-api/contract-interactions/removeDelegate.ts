import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { type Config, getBalance } from '@wagmi/core';
import { type SendTransactionMutate } from '@wagmi/core/query';
import { PrivateKeyAccount, type Address, type WalletClient, zeroAddress } from 'viem';
import { estimateGas } from 'viem/actions';

import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';

export async function removeDelegate(
  walletClient: WalletClient,
  delegateAccount: PrivateKeyAccount,
  proxyAddr: Address,
  sendTransaction: SendTransactionMutate<Config, unknown>
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
    functionName: 'setDelegate',
    args: [zeroAddress, 0],
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
    if (gasLimit && 2n * gasLimit * gasPrice < balance) {
      sendTransaction({
        account: delegateAccount,
        to: account,
        value: balance - 2n * gasLimit * gasPrice,
        chainId: walletClient.chain?.id,
        gas: gasLimit * 2n,
      });
    }
  }
  return { hash: tx };
}
