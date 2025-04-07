import { PROXY_ABI, type TraderInterface, floatToDecN } from '@d8x/perpetuals-sdk';
import type { Address, EstimateContractGasParameters, WalletClient, WriteContractParameters } from 'viem';
import { estimateContractGas } from 'viem/actions';

import { getGasLimit } from 'blockchain-api/getGasLimit';
import { getGasPrice } from 'blockchain-api/getGasPrice';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { MethodE } from 'types/enums';

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
  const amountCC = await traderAPI.fetchCollateralToSettlementConversion(symbol).then((c2s) => amount / c2s);
  const amountParsed = BigInt(floatToDecN(amountCC, decimals).toString());
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

  const estimateParams: EstimateContractGasParameters = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'addLiquidity',
    args: [poolId, amountParsed],
    account,
    gasPrice: gasPrice,
  };
  const gasLimit = await estimateContractGas(walletClient, estimateParams)
    .then((gas) => (gas * 130n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));

  // Create base params (shared between legacy and EIP-1559)
  const baseParams = {
    address: traderAPI.getProxyAddress() as Address,
    abi: PROXY_ABI,
    functionName: 'addLiquidity',
    args: [poolId, amountParsed],
    account: walletClient.account || null,
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
