import {
  getMeeScanLink,
  greaterThanOrEqualTo,
  MeeClient,
  MultichainSmartAccount,
  runtimeERC20BalanceOf,
  Trigger,
} from '@biconomy/abstractjs';
import { Address, Chain, erc20Abi } from 'viem';
import { getLifiQuote } from './lifi-quote-service';

export async function bridgeAndApprove({
  meeClient,
  account,
  fromChain,
  toChain,
  fromToken,
  toToken,
  amount,
  approvee,
}: {
  meeClient: MeeClient;
  account: MultichainSmartAccount;
  to: Address;
  approvee: Address;
  toToken: Address;
  fromToken: Address;
  fromChain: Chain;
  toChain: Chain;
  amount: bigint;
}) {
  const { transactionRequest } = await getLifiQuote({
    fromAddress: account.signer.address,
    toAddress: account.addressOn(toChain.id, true),
    fromAmount: amount.toString(),
    fromChain: fromChain.id.toString(),
    fromToken,
    toChain: toChain.id.toString(),
    toToken,
    order: 'FASTEST', // or 'CHEAPEST' for cost optimization
  });

  const trigger: Trigger = {
    chainId: fromChain.id,
    tokenAddress: fromToken,
    amount,
  };

  const approveLiFi = await account.buildComposable({
    type: 'approve',
    data: {
      amount,
      chainId: fromChain.id,
      spender: transactionRequest.to,
      tokenAddress: fromToken,
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
      chainId: toChain.id,
      to: toToken,
      functionName: 'approve',
      args: [
        approvee,
        runtimeERC20BalanceOf({
          targetAddress: account.addressOn(toChain.id, true),
          tokenAddress: toToken,
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
        chainId: toChain.id,
        recipientAddress: account.signer.address,
        tokenAddress: toToken,
      },
    ],
    feeToken: {
      address: fromToken,
      chainId: fromChain.id,
    },
    lowerBoundTimestamp: nowInSeconds,
    upperBoundTimestamp: nowInSeconds + 60,
  });
  console.log({ fusionQuote });
  const { hash } = await meeClient.executeFusionQuote({ fusionQuote });

  console.log(getMeeScanLink(hash));
}
