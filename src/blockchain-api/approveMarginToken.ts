import { readContracts, waitForTransactionReceipt } from '@wagmi/core';
import { type Address, encodeFunctionData, erc20Abi, parseUnits, WalletClient, zeroAddress } from 'viem';

import { MaxUint256 } from 'appConstants';

import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { SmartAccountClient } from 'permissionless';
import { SendTransactionCallT } from 'types/types';
import { hasPaymaster } from 'utils/hasPaymaster';
import { flatTokenAbi } from './abi/flatTokenAbi';
import { NORMAL_ADDRESS_TIMEOUT } from './constants';
import { registerFlatToken } from './contract-interactions/registerFlatToken';
import { wagmiConfig } from './wagmi/wagmiClient';

interface ApproveMarginTokenPropsI {
  walletClient: SmartAccountClient | WalletClient;
  sendTransaction: SendTransactionCallT;
  settleTokenAddr: string;
  proxyAddr: string;
  minAmount: number;
  decimals: number;
  registeredToken?: string; // TODO: this should be the user selected token, in case the pool token is a flat token
}

export async function approveMarginToken({
  walletClient,
  sendTransaction,
  settleTokenAddr,
  proxyAddr,
  minAmount,
  decimals,
  registeredToken,
}: ApproveMarginTokenPropsI) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const minAmountBN = parseUnits((1.05 * minAmount).toFixed(decimals), decimals);
  const [{ result: allowance }, { result: onChainRegisteredToken }, { result: tokenController }] = await readContracts(
    wagmiConfig,
    {
      contracts: [
        {
          address: settleTokenAddr as Address,
          abi: erc20Abi,
          functionName: 'allowance',
          args: [walletClient.account.address, proxyAddr as Address],
        },
        {
          address: settleTokenAddr as Address,
          abi: flatTokenAbi,
          functionName: 'registeredToken',
          args: [walletClient.account.address],
        },
        {
          address: settleTokenAddr as Address,
          abi: flatTokenAbi,
          functionName: 'controller',
        },
      ],
      allowFailure: true,
    }
  );

  if (allowance !== undefined && allowance >= minAmountBN) {
    return null;
  } else {
    const account = walletClient.account;
    if (!account) {
      throw new Error('account not connected');
    }
    const feesPerGas = await getFeesPerGas(walletClient.chain?.id);

    let [tokenAddress, spender] = [settleTokenAddr as Address, proxyAddr as Address];

    if (onChainRegisteredToken !== undefined && tokenController !== undefined && tokenController === spender) {
      // this is a flat token
      spender = settleTokenAddr as Address; // flat token spends real tokens, proxy spends flat tokens and needs no approval
      // tokenAddress = user registered token
      if (registeredToken !== undefined && onChainRegisteredToken === zeroAddress) {
        // user has to register first
        tokenAddress = registeredToken as Address;
        await registerFlatToken({
          walletClient,
          flatTokenAddr: settleTokenAddr as Address,
          userTokenAddr: tokenAddress,
          feesPerGas,
        });
      } else if (onChainRegisteredToken !== zeroAddress) {
        // already registered
        if (onChainRegisteredToken !== registeredToken) {
          // user selected token was sent and is not the one already registered
          throw new Error(`Registered token (${onChainRegisteredToken}) !=  User selected token (${registeredToken})`);
        }
        tokenAddress = onChainRegisteredToken;
      } else {
        // insufficient data
        throw new Error(`Account is not registered and no token selected`);
      }
    }

    const call = {
      chain: walletClient.chain,
      to: tokenAddress,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, BigInt(MaxUint256)],
      }),
      value: 0n,
    };

    return sendTransaction(call, { sponsor: hasPaymaster(walletClient.chain?.id) }).then(async ({ hash }) => {
      await waitForTransactionReceipt(wagmiConfig, {
        hash,
        timeout: NORMAL_ADDRESS_TIMEOUT,
      });
      return { hash };
    });
  }
}
