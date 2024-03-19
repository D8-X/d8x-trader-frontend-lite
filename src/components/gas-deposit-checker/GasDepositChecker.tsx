import { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { depositModalOpenAtom } from 'store/global-modals.store';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { MethodE } from 'types/enums';
import { useSetAtom } from 'jotai/index';

interface GasDepositCheckerPropsI extends PropsWithChildren {
  multiplier?: bigint;
}

export const GasDepositChecker = ({ children, multiplier = 1n }: GasDepositCheckerPropsI) => {
  const { t } = useTranslation();

  const { hasEnoughGas } = useUserWallet();

  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);

  const hasGas = hasEnoughGas(MethodE.Approve, multiplier);

  if (hasGas) {
    return children;
  }

  return (
    <Button variant="buy" onClick={() => setDepositModalOpen(true)}>
      {t('common.deposit-gas')}
    </Button>
  );
};
