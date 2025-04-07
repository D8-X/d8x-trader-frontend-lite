import { readContracts, waitForTransactionReceipt } from '@wagmi/core';
import {
  type Address,
  erc20Abi,
  type EstimateContractGasParameters,
  parseUnits,
  type WalletClient,
  type WriteContractParameters,
  zeroAddress,
} from 'viem';
import { estimateContractGas } from 'viem/actions';

import { MaxUint256 } from 'appConstants';

import { getGasPrice } from './getGasPrice';
import { getFeesPerGas } from 'blockchain-api/getFeesPerGas';
import { wagmiConfig } from './wagmi/wagmiClient';
import { getGasLimit } from 'blockchain-api/getGasLimit';
import { MethodE } from 'types/enums';
import { MULTISIG_ADDRESS_TIMEOUT, NORMAL_ADDRESS_TIMEOUT } from './constants';
import { registerFlatToken } from './contract-interactions/registerFlatToken';
import { flatTokenAbi } from './contract-interactions/flatTokenAbi';

interface ApproveMarginTokenPropsI {
  walletClient: WalletClient;
  settleTokenAddr: string;
  isMultisigAddress: boolean | null;
  proxyAddr: string;
  minAmount: number;
  decimals: number;
  registeredToken?: string; // TODO: this should be the user selected token, in case the pool token is a flat token
}

export async function approveMarginToken({
  walletClient,
  settleTokenAddr,
  isMultisigAddress,
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
    const gasPrice = await getGasPrice(walletClient.chain?.id);
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
          isMultisigAddress,
          gasPrice,
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
      gasPrice: gasPrice,
      account: account,
    };
    const gasLimit = await estimateContractGas(walletClient, estimateParams).catch(() =>
      getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Approve })
    );

    // Create base params (shared between legacy and EIP-1559)
    const baseParams = {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, BigInt(MaxUint256)],
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

      return walletClient.writeContract(eip1559Params).then(async (tx) => {
        await waitForTransactionReceipt(wagmiConfig, {
          hash: tx,
          timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
        });
        return { hash: tx };
      });
    } else {
      // Legacy transaction
      const legacyParams: WriteContractParameters = {
        ...baseParams,
        gasPrice,
      };

      return walletClient.writeContract(legacyParams).then(async (tx) => {
        await waitForTransactionReceipt(wagmiConfig, {
          hash: tx,
          timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
        });
        return { hash: tx };
      });
    }
  }
}
