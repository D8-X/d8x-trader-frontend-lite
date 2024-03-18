import { PROXY_ABI, type TraderInterface, floatToDecN } from '@d8x/perpetuals-sdk';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { type Address, type WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

export async function addLiquidity(
  walletClient: WalletClient,
  traderAPI: TraderInterface,
  symbol: string,
  amount: number
): Promise<{ hash: Address }> {
  const decimals = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  const poolId = traderAPI.getPoolIdFromSymbol(symbol);
  const account = walletClient.account?.address;
  if (!decimals || !poolId || !account) {
    throw new Error('undefined call parameters');
  }
  const amountParsed = BigInt(floatToDecN(amount, decimals).toString());
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const params = {
    chain: walletClient.chain,
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'addLiquidity',
    args: [poolId, amountParsed],
    account: account,
    gasPrice: gasPrice,
  };
  const gasLimit = await estimateContractGas(walletClient, params);
  return walletClient.writeContract({ ...params, gas: (gasLimit * 110n) / 100n }).then((tx) => ({ hash: tx }));
}
