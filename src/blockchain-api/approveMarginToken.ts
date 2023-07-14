import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { parseUnits } from '@ethersproject/units';
import { MaxUint256 } from '@ethersproject/constants';

import { erc20ABI } from 'wagmi';

export function approveMarginToken(
  signer: Signer,
  marginTokenAddr: string,
  proxyAddr: string,
  minAmount: number,
  decimals: number
) {
  const marginToken = new Contract(marginTokenAddr, erc20ABI, signer);
  const amount = MaxUint256;
  const minAmountBN = parseUnits((4 * minAmount).toFixed(decimals), decimals);
  return signer.getAddress().then((addr: string) => {
    return marginToken.allowance(addr, proxyAddr).then((allowance: BigNumber) => {
      if (allowance.gt(minAmountBN)) {
        return Promise.resolve(null);
      } else {
        return marginToken.approve(proxyAddr, amount, { gasLimit: BigNumber.from(1_000_000) });
      }
    });
  });
}
