import { useChainModal } from '@rainbow-me/rainbowkit';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

interface WrongNetworkButtonPropsI {
  className?: string;
}

export const WrongNetworkButton = ({ className }: WrongNetworkButtonPropsI) => {
  const { t } = useTranslation();

  const { openChainModal } = useChainModal();

  return (
    <Button onClick={openChainModal} variant="warning" className={className}>
      {t('error.wrong-network')}
    </Button>
  );
};
