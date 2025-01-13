import { type Config, getBalance } from '@wagmi/core';
import { type SendTransactionMutateAsync } from '@wagmi/core/query';
import { type Address, erc20Abi } from 'viem';
import { estimateGas, waitForTransactionReceipt, writeContract } from 'viem/actions';

import { HedgeConfigI } from 'types/types';

import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';
import { MULTISIG_ADDRESS_TIMEOUT, NORMAL_ADDRESS_TIMEOUT } from '../constants';

const GAS_TARGET = 1_000_000n;

export async function claimStrategyFunds(
  {
    chainId,
    walletClient,
    strategyClient,
    isMultisigAddress,
    symbol,
    traderAPI,
    strategyAddressBalanceBigint,
  }: HedgeConfigI,
  sendTransactionAsync: SendTransactionMutateAsync<Config, unknown>
): Promise<{
  hash: Address | null;
}> {
  if (!walletClient.account?.address || !strategyClient.account?.address || !strategyAddressBalanceBigint) {
    throw new Error('Account not connected');
  }

  //console.log('get position');
  const position = await traderAPI
    .positionRisk(strategyClient.account.address, symbol)
    .then((pos) => pos[0])
    .catch(() => undefined);
  const settleTokenAddr = traderAPI.getSettlementTokenFromSymbol(symbol);
  const settleTokenDec = traderAPI.getSettlementTokenDecimalsFromSymbol(symbol);
  if (!position || !settleTokenAddr || !settleTokenDec) {
    throw new Error(`No hedging strategy available for symbol ${symbol} on chain ID ${chainId}`);
  }
  if (position.positionNotionalBaseCCY !== 0) {
    throw new Error(
      `Invalid hedging position for trader ${walletClient.account?.address} and symbol ${symbol} on chain ID ${chainId}`
    );
  }

  //console.log('get balance and gas');
  const settleTokenBalance = strategyAddressBalanceBigint;
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  if (settleTokenBalance > 0n) {
    const params = {
      address: settleTokenAddr as Address,
      chain: walletClient.chain,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [walletClient.account.address, settleTokenBalance],
      account: strategyClient.account,
      gasPrice,
    };

    //console.log('estimateGas: erc20');
    const gasLimit = await estimateGas(strategyClient, params)
      .then((gas) => (gas * 150n) / 100n)
      .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
    const { value: balance } = await getBalance(wagmiConfig, { address: strategyClient.account.address });
    if (!gasLimit || balance < gasPrice * gasLimit) {
      //console.log('sending funds to strategy acct');
      const tx0 = await sendTransactionAsync({
        account: walletClient.account,
        chainId: walletClient.chain?.id,
        to: strategyClient.account.address,
        value: (gasLimit ?? GAS_TARGET) * gasPrice,
      });
      await waitForTransactionReceipt(strategyClient, {
        hash: tx0,
        timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
      });
    }

    //console.log(`sending ${marginTokenBalance} tokens`);
    const tx1 = await writeContract(strategyClient, {
      address: settleTokenAddr as Address,
      chain: walletClient.chain,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [walletClient.account.address, settleTokenBalance],
      account: strategyClient.account,
      gas: gasLimit,
      gasPrice,
    });
    await waitForTransactionReceipt(strategyClient, {
      hash: tx1,
      timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
    });
  }

  //console.log('estimateGas: gas');
  const gasLimit = await estimateGas(walletClient, {
    to: walletClient.account.address,
    value: 1n,
    account: strategyClient.account,
    gasPrice,
  })
    .then((gas) => (gas * 150n) / 100n)
    .catch(() => getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Interact }));
  const { value: balance } = await getBalance(wagmiConfig, { address: strategyClient.account.address });
  if (gasLimit && gasLimit * gasPrice < balance) {
    return sendTransactionAsync({
      account: strategyClient.account,
      chainId: strategyClient.chain?.id,
      to: walletClient.account.address,
      value: balance - gasLimit * gasPrice,
    }).then((tx) => ({ hash: tx }));
  }
  return { hash: null };
}
