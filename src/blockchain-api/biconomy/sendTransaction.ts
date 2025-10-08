import { MeeClient, MultichainSmartAccount } from '@biconomy/abstractjs';
import { Address, Hex } from 'viem';

/// sends transaction on one chain, paying for gas using some token in another chain
export async function sendTransaction({
  meeClient,
  account,
  transaction,
  feeToken,
}: {
  meeClient: MeeClient;
  account: MultichainSmartAccount;
  transaction: {
    to: Address;
    calldata: Hex;
    chainId: number;
    gasLimit?: bigint | number | string;
    value?: bigint | number | string;
  };
  feeToken: { address: Address; chainId: number; gasRefundAddress?: Address };
}) {
  const runtimeInstruction = await account.buildComposable({
    type: 'rawCalldata',
    data: {
      to: transaction.to,
      calldata: transaction.calldata,
      chainId: transaction.chainId,
      gasLimit: transaction.gasLimit ? BigInt(transaction.gasLimit) : undefined,
      value: transaction.value ? BigInt(transaction.value) : undefined,
    },
  });

  const { hash } = await meeClient.execute({
    account,
    feeToken,
    instructions: [runtimeInstruction],
  });

  console.log('Submitted tx hash:', hash);

  const receipt = await meeClient.waitForSupertransactionReceipt({ hash });
  console.log('Tx complete:', receipt.hash);
}
