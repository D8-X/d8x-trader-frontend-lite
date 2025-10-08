import {
  getMeeScanLink,
  greaterThanOrEqualTo,
  MeeClient,
  MultichainSmartAccount,
  runtimeERC20BalanceOf,
  Trigger,
} from '@biconomy/abstractjs';
import { Address, Chain, erc20Abi } from 'viem';
import { base } from 'viem/chains';
import { getLifiQuote } from './lifi-quote-service';

const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

export async function bridgeFromBaseAndApprove({
  meeClient,
  account,
  chain,
  token,
  amount,
  approvee,
}: {
  meeClient: MeeClient;
  account: MultichainSmartAccount;
  to: Address;
  approvee: Address;
  token: Address;
  chain: Chain;
  amount: bigint;
}) {
  const { transactionRequest } = await getLifiQuote({
    fromAddress: account.signer.address,
    toAddress: account.addressOn(chain.id, true),
    fromAmount: amount.toString(),
    fromChain: base.id.toString(),
    fromToken: BASE_USDC_ADDRESS,
    toChain: chain.id.toString(),
    toToken: token,
    order: 'FASTEST', // or 'CHEAPEST' for cost optimization
  });

  const trigger: Trigger = {
    chainId: base.id,
    tokenAddress: BASE_USDC_ADDRESS,
    amount,
  };

  const approveLiFi = await account.buildComposable({
    type: 'approve',
    data: {
      amount,
      chainId: base.id,
      spender: transactionRequest.to,
      tokenAddress: BASE_USDC_ADDRESS,
    },
  });

  const callLiFiInstruction = await account.buildComposable({
    type: 'rawCalldata',
    data: {
      to: transactionRequest.to,
      calldata: transactionRequest.data,
      chainId: transactionRequest.chainId,
      gasLimit: BigInt(transactionRequest.gasLimit),
      value: BigInt(transactionRequest.value),
    },
  });

  const approvePerp = await account.buildComposable({
    type: 'default',
    data: {
      abi: erc20Abi,
      chainId: chain.id,
      to: token,
      functionName: 'approve',
      args: [
        approvee,
        runtimeERC20BalanceOf({
          targetAddress: account.addressOn(chain.id, true),
          tokenAddress: token,
          constraints: [greaterThanOrEqualTo(1n)],
        }),
      ],
    },
  });

  const nowInSeconds = Math.floor(Date.now() / 1000);

  const fusionQuote = await meeClient.getFusionQuote({
    trigger,
    instructions: [approveLiFi, callLiFiInstruction, approvePerp],
    cleanUps: [
      {
        chainId: chain.id,
        recipientAddress: account.signer.address,
        tokenAddress: token,
      },
    ],
    feeToken: {
      address: BASE_USDC_ADDRESS,
      chainId: base.id,
    },
    lowerBoundTimestamp: nowInSeconds,
    upperBoundTimestamp: nowInSeconds + 60,
  });

  const { hash } = await meeClient.executeFusionQuote({ fusionQuote });
  console.log(getMeeScanLink(hash));
}
