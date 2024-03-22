import { useSetAtom } from 'jotai';
import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { Address } from 'viem';
import { useBalance } from 'wagmi';

import { Button } from '@mui/material';

import { depositModalOpenAtom } from 'store/global-modals.store';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { MethodE } from 'types/enums';

interface GasDepositCheckerPropsI extends PropsWithChildren {
  multiplier?: bigint;
  address?: Address;
}

export const GasDepositChecker = ({ children, multiplier = 1n, address }: GasDepositCheckerPropsI) => {
  const { t } = useTranslation();

  const { hasEnoughGasForFee, calculateGasForFee } = useUserWallet();
  const { data: gasTokenBalance } = useBalance({ address });

  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);

  const hasGas = gasTokenBalance
    ? gasTokenBalance.value > calculateGasForFee(MethodE.Approve, multiplier)
    : hasEnoughGasForFee(MethodE.Approve, multiplier);

  if (hasGas) {
    return children;
  }

  return (
    <Button variant="buy" onClick={() => setDepositModalOpen(true)}>
      {t('common.deposit-gas')}
    </Button>
  );
};
