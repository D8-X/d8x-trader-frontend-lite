import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { publicClient } from 'blockchain-api/wagmi/wagmiClient';
import { type Address, type WalletClient } from 'viem';

export async function removeDelegate(
  walletClient: WalletClient,
  tradingClient: WalletClient,
  proxyAddr: Address
): Promise<{ hash: Address }> {
  const account = walletClient.account?.address;
  if (!account) {
    throw new Error('account not connected');
  }

  let gasPrice = await getGasPrice(walletClient.chain?.id);
  // reclaim funds
  if (tradingClient.account && account !== tradingClient.account.address) {
    const chainId = walletClient.chain?.id;
    const delegateAddr = tradingClient.account?.address;
    if (!gasPrice) {
      gasPrice = await publicClient({ chainId }).getGasPrice();
    }
    const balance = await publicClient({ chainId }).getBalance({ address: delegateAddr });
    if (21_000n * gasPrice < balance) {
      await tradingClient.sendTransaction({
        to: account,
        value: balance - 21_000n * gasPrice,
        account: delegateAddr,
        chain: tradingClient.chain,
        gas: 21000n,
        gasPrice: gasPrice,
      });
    }
  }

  // remove delegate
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: proxyAddr as Address,
      abi: PROXY_ABI,
      functionName: 'removeDelegate',
      args: [],
      gas: BigInt(1_000_000),
      gasPrice: gasPrice,
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
