import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { publicClient } from 'blockchain-api/wagmi/wagmiClient';
import { PrivateKeyAccount, type Address, type WalletClient } from 'viem';

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
  let gasPrice = await getGasPrice(walletClient.chain?.id);
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
    const chainId = walletClient.chain?.id;
    if (!gasPrice) {
      gasPrice = await publicClient({ chainId }).getGasPrice();
    }
    const gasLimit = getGasLimit({ chainId: walletClient.chain?.id, method: 'transfer' });
    const balance = await publicClient({ chainId }).getBalance({ address: delegateAccount.address });
    if (gasLimit * gasPrice < balance) {
      await walletClient.sendTransaction({
        to: account,
        value: balance - gasLimit * gasPrice,
        chain: walletClient.chain,
        gas: gasLimit,
        gasPrice: gasPrice,
        account: delegateAccount,
      });
    }
  }
  return { hash: tx };
}
