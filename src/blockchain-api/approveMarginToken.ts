import { BigNumber, Signer, Contract, constants, utils } from 'ethers';

import { ERC20_ABI } from './constants';

export function approveMarginToken(signer: Signer, marginTokenAddr: string, proxyAddr: string, minAmount: number) {
  const marginToken: Contract = new Contract(marginTokenAddr, ERC20_ABI, signer);
  const amount = constants.MaxUint256;
  const minAmountBN = utils.parseUnits((4 * minAmount).toString(), 18);
  return signer.getAddress().then((addr: string) => {
    marginToken.allowance(addr, proxyAddr).then((allowance: BigNumber) => {
      if (allowance.gt(minAmountBN)) {
        Promise.resolve();
      } else {
        marginToken.approve(proxyAddr, amount, { gasLimit: BigNumber.from(1_000_000) });
      }
    });
  });
}
