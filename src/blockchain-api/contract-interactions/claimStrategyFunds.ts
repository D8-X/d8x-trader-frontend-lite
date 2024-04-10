import { type Config, getBalance } from '@wagmi/core';
import { type SendTransactionMutateAsync } from '@wagmi/core/query';
import { createWalletClient, type Address, http, erc20Abi } from 'viem';
import { estimateGas, readContract, waitForTransactionReceipt, writeContract } from 'viem/actions';

import { generateStrategyAccount } from 'blockchain-api/generateStrategyAccount';
import { HedgeConfigI } from 'types/types';

import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';

const GAS_TARGET = 1_000_000n;

export async function claimStrategyFunds(
  { chainId, walletClient, symbol, traderAPI }: HedgeConfigI,
  sendTransactionAsync: SendTransactionMutateAsync<Config, unknown>
): Promise<{
  hash: Address | null;
}> {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }

  console.log('generating account');
  const hedgeClient = await generateStrategyAccount(walletClient).then((account) =>
    createWalletClient({
      account,
      chain: walletClient.chain,
      transport: http(),
    })
  );

  console.log('get position');
  const position = await traderAPI
    .positionRisk(hedgeClient.account.address, symbol)
    .then((pos) => pos[0])
    .catch(() => undefined);
  const marginTokenAddr = traderAPI.getMarginTokenFromSymbol(symbol);
  const marginTokenDec = traderAPI.getMarginTokenDecimalsFromSymbol(symbol);
  if (!position || !marginTokenAddr || !marginTokenDec) {
    throw new Error(`No hedging strategy available for symbol ${symbol} on chain ID ${chainId}`);
  }
  if (position.positionNotionalBaseCCY !== 0) {
    throw new Error(
      `Invalid hedging position for trader ${walletClient.account?.address} and symbol ${symbol} on chain ID ${chainId}`
    );
  }

  console.log('get balance and gas');
  const marginTokenBalance = await readContract(walletClient, {
    address: marginTokenAddr as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [hedgeClient.account.address],
  });
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  if (marginTokenBalance > 0n) {
    const params = {
      address: marginTokenAddr as Address,
      chain: walletClient.chain,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [walletClient.account.address, marginTokenBalance],
      account: hedgeClient.account,
      gasPrice,
    };

    console.log('estimateGas: erc20');
    const gasLimit = await estimateGas(hedgeClient, params)
      .then((gas) => (gas * 150n) / 100n)
      .catch(() => undefined);
    const { value: balance } = await getBalance(wagmiConfig, { address: hedgeClient.account.address });
    if (!gasLimit || balance < gasPrice * gasLimit) {
      console.log('sending funds to strategy acct');
      const tx0 = await sendTransactionAsync({
        account: walletClient.account,
        chainId: walletClient.chain?.id,
        to: hedgeClient.account.address,
        value: (gasLimit ?? GAS_TARGET) * gasPrice,
        gas: gasLimit,
      });
      await waitForTransactionReceipt(hedgeClient, { hash: tx0 });
    }

    console.log(`sending ${marginTokenBalance} tokens`);
    const tx1 = await writeContract(hedgeClient, {
      address: marginTokenAddr as Address,
      chain: walletClient.chain,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [walletClient.account.address, marginTokenBalance],
      account: hedgeClient.account,
      gas: gasLimit,
      gasPrice,
    });
    await waitForTransactionReceipt(hedgeClient, { hash: tx1 });
  }

  console.log('estimateGas: gas');
  const gasLimit = await estimateGas(walletClient, {
    to: walletClient.account.address,
    value: 1n,
    account: hedgeClient.account,
    gasPrice,
  }).catch((error) => {
    console.error(error);
    return undefined;
  });
  const { value: balance } = await getBalance(wagmiConfig, { address: hedgeClient.account.address });
  if (gasLimit && gasLimit * gasPrice < balance) {
    console.log('sendTransactionAsync');
    return sendTransactionAsync({
      account: hedgeClient.account,
      chainId: hedgeClient.chain?.id,
      to: walletClient.account.address,
      value: balance - gasLimit * gasPrice,
      gas: gasLimit,
    }).then((tx) => ({ hash: tx }));
  }
  return { hash: null };
}
