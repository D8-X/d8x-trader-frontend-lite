import { ethers, Contract, BigNumber } from 'ethers';

import { CollateralChangeResponseI } from 'types/types';

export function withdraw(signer: ethers.providers.JsonRpcSigner, data: CollateralChangeResponseI) {
  const contract = new Contract(data.proxyAddr, [data.abi], signer);
  return contract.withdraw(
    data.perpId,
    BigNumber.from(data.amountHex),
    data.priceUpdate.updateData,
    data.priceUpdate.publishTimes,
    { gasLimit: 1_000_000, value: data.priceUpdate.updateFee }
  );
}
