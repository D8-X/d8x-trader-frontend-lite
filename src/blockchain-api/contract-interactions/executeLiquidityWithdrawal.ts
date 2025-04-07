import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import type { Account, Address, Chain, EstimateContractGasParameters, Transport, WalletClient } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';

import { MethodE } from 'types/enums';

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
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'executeLiquidityWithdrawal',
    args: [poolId, walletClient.account?.address],
    account,
    ...feesPerGas,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
  const baseParams = {
    ...estimateParams,
    account: account,
    chain: walletClient.chain,
    gas: gasLimit,
  };

  return walletClient.writeContract(baseParams).then((tx) => ({ hash: tx }));
}
