import { PROXY_ABI } from '@d8x/perpetuals-sdk';
import { getBalance, getGasPrice as getGasPriceWagmi } from '@wagmi/core';
import { PrivateKeyAccount, type Address, type WalletClient } from 'viem';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { MethodE } from 'types/enums';

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
      gasPrice = await getGasPriceWagmi(wagmiConfig, { chainId });
    }
    const gasLimit = getGasLimit({ chainId: walletClient.chain?.id, method: MethodE.Transfer });
    const { value: balance } = await getBalance(wagmiConfig, { address: delegateAccount.address });
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
