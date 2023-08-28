import { PROXY_ABI, TraderInterface, floatToDecN } from '@d8x/perpetuals-sdk';
import { AddressT } from 'types/types';
import { WalletClient } from 'viem';

export async function addLiquidity(
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  symbol: string,
  amount: number
): Promise<{ hash: AddressT }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  const account = walletClient.account?.address;
  if (!decimals || !poolId || !account) {
    throw new Error('undefined call parameters');
  }
  const amountParsed = BigInt(floatToDecN(amount, decimals).toString());
  return walletClient
    .writeContract({
      chain: walletClient.chain,
      address: traderAPI.getProxyAddress() as AddressT,
      abi: PROXY_ABI,
      functionName: 'addLiquidity',
      args: [poolId, amountParsed],
      account: account,
      gas: BigInt(2_000_000),
    })
    .then((tx) => ({ hash: tx }));
}
