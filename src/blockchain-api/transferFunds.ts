import { parseEther, type Address, WalletClient } from 'viem';

export function transferFunds(walletClient: WalletClient, to: Address, amount: number) {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  return walletClient
    .sendTransaction({
      account: walletClient.account,
      chain: walletClient.chain,
      to: to,
      value: parseEther(`${amount}`),
    })
    .then((tx) => ({ hash: tx }));
}
