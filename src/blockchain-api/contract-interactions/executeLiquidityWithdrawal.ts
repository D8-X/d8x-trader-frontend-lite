import { PROXY_ABI, type TraderInterface } from '@d8x/perpetuals-sdk';
import type {
  Account,
  Address,
  Chain,
  EstimateContractGasParameters,
  Transport,
  WalletClient,
  WriteContractParameters,
} from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
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
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'executeLiquidityWithdrawal',
    args: [poolId, walletClient.account?.address],
    gasPrice,
    account,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'executeLiquidityWithdrawal',
    args: [poolId, walletClient.account?.address],
    account: account,
    chain: walletClient.chain,
    gas: gasLimit,
  };

  // Determine which transaction type to use
  if (feesPerGas && 'maxFeePerGas' in feesPerGas && 'maxPriorityFeePerGas' in feesPerGas) {
    // EIP-1559 transaction
    const eip1559Params: WriteContractParameters = {
      ...baseParams,
      maxFeePerGas: feesPerGas.maxFeePerGas,
      maxPriorityFeePerGas: feesPerGas.maxPriorityFeePerGas,
    };

    return walletClient.writeContract(eip1559Params).then((tx) => ({ hash: tx }));
  } else {
    // Legacy transaction
    const legacyParams: WriteContractParameters = {
      ...baseParams,
      gasPrice,
    };

    return walletClient.writeContract(legacyParams).then((tx) => ({ hash: tx }));
  }
}
