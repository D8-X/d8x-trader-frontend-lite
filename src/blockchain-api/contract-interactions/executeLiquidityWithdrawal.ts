import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import type { Account, Address, Chain, Transport, WalletClient } from 'viem';

export async function executeLiquidityWithdrawal(
  walletClient: WalletClient<Transport, Chain, Account>,
  traderAPI: TraderInterface,
  symbol: string
): Promise<{ hash: Address }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  const account = walletClient.account?.address;
  if (!decimals || !poolId || !account) {
    throw new Error('undefined call parameters');
  }
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: traderAPI.getProxyAddress() as Address,
      abi: PROXY_ABI,
      functionName: 'executeLiquidityWithdrawal',
      args: [poolId, walletClient.account?.address],
      gasPrice: gasPrice,
      account: account,
    })
    .then((tx) => ({ hash: tx }));
}
