import { Signer } from '@ethersproject/abstract-signer';
import { Contract, ContractTransaction } from '@ethersproject/contracts';

import { CollateralChangeResponseI } from 'types/types';

export function deposit(signer: Signer, data: CollateralChangeResponseI): Promise<ContractTransaction> {
  const contract = new Contract(data.proxyAddr, [data.abi], signer);
  return contract.deposit(
    data.perpId,
    +data.amountHex, // BigNumber => BigInt
    data.priceUpdate.updateData,
    data.priceUpdate.publishTimes,
    { gasLimit: 1_000_000, value: data.priceUpdate.updateFee }
  );
}
