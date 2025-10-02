import { readContracts, waitForTransactionReceipt } from '@wagmi/core';
import {
  type Address,
  erc20Abi,
  type EstimateContractGasParameters,
  parseUnits,
  WalletClient,
  zeroAddress,
} from 'viem';
import { estimateContractGas } from 'viem/actions';

import { MaxUint256 } from 'appConstants';

import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { SmartAccountClient } from 'permissionless';
import { MethodE } from 'types/enums';
import { flatTokenAbi } from './abi/flatTokenAbi';
import { NORMAL_ADDRESS_TIMEOUT } from './constants';
import { registerFlatToken } from './contract-interactions/registerFlatToken';
import { wagmiConfig } from './wagmi/wagmiClient';

interface ApproveMarginTokenPropsI {
  walletClient: SmartAccountClient | WalletClient;
  settleTokenAddr: string;
  proxyAddr: string;
  minAmount: number;
  decimals: number;
  registeredToken?: string; // TODO: this should be the user selected token, in case the pool token is a flat token
}

export async function approveMarginToken({
  walletClient,
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

    const estimateParams: EstimateContractGasParameters = {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, BigInt(MaxUint256)],
      account: account,
      ...feesPerGas,
    };
    const gasLimit = await estimateContractGas(walletClient, estimateParams).catch(() =>
      getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Approve })
    );

    // Create base params (shared between legacy and EIP-1559)
    const baseParams = {
      ...estimateParams,
      chain: walletClient.chain,
      account: account,
      gas: gasLimit,
    };
    return walletClient.writeContract(baseParams).then(async (tx) => {
      await waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
        timeout: NORMAL_ADDRESS_TIMEOUT,
      });
      return { hash: tx };
    });
  }
}
