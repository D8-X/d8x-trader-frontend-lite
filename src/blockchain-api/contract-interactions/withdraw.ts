import { Signer } from '@ethersproject/abstract-signer';
import { Contract, ContractTransaction } from '@ethersproject/contracts';

import { CollateralChangeResponseI } from 'types/types';

export function withdraw(signer: Signer, data: CollateralChangeResponseI): Promise<ContractTransaction> {
  const contract = new Contract(data.proxyAddr, [data.abi], signer);
  return contract.withdraw(
    data.perpId,
    +data.amountHex, // BigNumber => BigInt
    data.priceUpdate.updateData,
    data.priceUpdate.publishTimes,
    { gasLimit: 1_000_000, value: data.priceUpdate.updateFee }
  );
}
