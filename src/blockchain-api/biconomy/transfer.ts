import { MeeClient, MultichainSmartAccount } from '@biconomy/abstractjs';
import { Address, Hex } from 'viem';
import { base } from 'viem/chains';

const BASE_USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// if fee token is not given, it is assumed to be USDC on Base
// otherwise, this is generic

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
  feeToken?: { address: Address; chainId: number; gasRefundAddress?: Address };
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
    feeToken: feeToken == undefined ? { chainId: base.id, address: BASE_USDC_ADDRESS } : feeToken,
    instructions: [runtimeInstruction],
  });

  console.log('Submitted tx hash:', hash);

  const receipt = await meeClient.waitForSupertransactionReceipt({ hash });
  console.log('Tx complete:', receipt.hash);
}
