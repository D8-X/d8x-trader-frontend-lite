import { createWalletClient, type Address, http, erc20Abi } from 'viem';

import { generateStrategyAccount } from 'blockchain-api/generateStrategyAccount';
import { HedgeConfigI } from 'types/types';

import { getGasPrice } from 'blockchain-api/getGasPrice';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { getBalance } from '@wagmi/core';
import { estimateGas, readContract, writeContract } from 'viem/actions';

export async function claimStrategyFunds({ chainId, walletClient, symbol, traderAPI }: HedgeConfigI) {
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

  const { value: balance } = await getBalance(wagmiConfig, { address: hedgeClient.account.address });
  const gasPrice = await getGasPrice(walletClient.chain?.id);
  const marginTokenBalance = await readContract(walletClient, {
    address: marginTokenAddr as Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [hedgeClient.account.address],
  });
  if (marginTokenBalance > 0n) {
    await writeContract(walletClient, {
      address: marginTokenAddr as Address,
      chain: walletClient.chain,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [hedgeClient.account.address, marginTokenBalance],
      account: walletClient.account,
    });
  }
  const gasLimit = await estimateGas(walletClient, {
    to: walletClient.account.address,
    value: 1n,
    account: hedgeClient.account,
    gasPrice,
  }).catch(() => undefined);
  if (gasLimit && gasLimit * gasPrice < balance) {
    await walletClient.sendTransaction({
      to: walletClient.account.address,
      value: balance - gasLimit * gasPrice,
      chain: walletClient.chain,
      gas: gasLimit,
      gasPrice,
      account: hedgeClient.account,
    });
  }
}
