import { parseEther, type Address, type WalletClient } from 'viem';

export async function transferFunds(
  walletClient: WalletClient,
  to: Address,
  amount: number,
  gas?: bigint,
  gasPrice?: bigint
) {
  if (!walletClient.account) {
    throw new Error('account not connected');
  }
  return walletClient.sendTransaction({
    account: walletClient.account,
    chain: walletClient.chain,
    value: parseEther(`${amount}`),
    gasPrice,
    gas,
    to,
  });
}
