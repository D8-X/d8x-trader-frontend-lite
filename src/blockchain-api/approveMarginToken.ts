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
  userSelectedToken?: string; // TODO: this should be the user selected token, in case the pool token is a flat token
}

export async function approveMarginToken({
  walletClient,
  settleTokenAddr,
  isMultisigAddress,
  proxyAddr,
  minAmount,
  decimals,
  userSelectedToken,
}: ApproveMarginTokenPropsI) {
  if (!walletClient.account?.address) {
    throw new Error('Account not connected');
  }
  const minAmountBN = parseUnits((1.05 * minAmount).toFixed(decimals), decimals);
  const [{ result: allowance }, { result: registeredToken }] = await readContracts(wagmiConfig, {
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
    ],
    allowFailure: true,
  });

  if (allowance !== undefined && allowance >= minAmountBN) {
    return null;
  } else {
    const account = walletClient.account;
    if (!account) {
      throw new Error('account not connected');
    }
    const gasPrice = await getGasPrice(walletClient.chain?.id);

    let [tokenAddress, spender] = [settleTokenAddr, proxyAddr];

    if (registeredToken !== undefined) {
      // this is a flat token
      spender = settleTokenAddr; // flat token spends real tokens
      if (userSelectedToken !== undefined && registeredToken === zeroAddress) {
        // user has to register first
        tokenAddress = userSelectedToken;
        await registerFlatToken({
          walletClient,
          flatTokenAddr: settleTokenAddr as Address,
          userTokenAddr: userSelectedToken as Address,
          isMultisigAddress,
          gasPrice,
        });
      } else if (registeredToken !== zeroAddress) {
        // already registered
        tokenAddress = registeredToken;
      } else if (registeredToken !== userSelectedToken) {
        // user already registered but with a different token
        throw new Error(`Registered token (${tokenAddress}) !=  User selected token (${userSelectedToken})`);
      } else {
        // insufficient data
        throw new Error(`Account is not registered and no token selected`);
      }
    }

    const estimateParams: EstimateContractGasParameters = {
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender as Address, BigInt(MaxUint256)],
      gasPrice: gasPrice,
      account: account,
    };
    const gasLimit = await estimateContractGas(walletClient, estimateParams).catch(() =>
      getGasLimit({ chainId: walletClient?.chain?.id, method: MethodE.Approve })
    );

    const writeParams: WriteContractParameters = {
      ...estimateParams,
      chain: walletClient.chain,
      account: account,
      gas: gasLimit,
    };
    return walletClient.writeContract(writeParams).then(async (tx) => {
      await waitForTransactionReceipt(wagmiConfig, {
        hash: tx,
        timeout: isMultisigAddress ? MULTISIG_ADDRESS_TIMEOUT : NORMAL_ADDRESS_TIMEOUT,
      });
      return { hash: tx };
    });
  }
}
