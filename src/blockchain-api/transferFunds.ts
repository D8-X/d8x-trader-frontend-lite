import { parseEther, type Account, type Address, type Transport } from 'viem';
import type { Chain, WalletClient } from 'wagmi';

export function transferFunds(walletClient: WalletClient<Transport, Chain, Account>, to: Address, amount: number) {
  return walletClient
    .sendTransaction({
      to: to,
      value: parseEther(`${amount}`),
    })
    .then((tx) => ({ hash: tx }));
}
