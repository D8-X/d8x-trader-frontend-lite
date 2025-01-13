import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { cedeModalOpenAtom } from 'store/global-modals.store';

import styles from '../../DepositModal.module.scss';

export const CedeWidgetButton = () => {
  const { t } = useTranslation();

  const setModalOpen = useSetAtom(cedeModalOpenAtom);

  return (
    <Button
      onClick={() => setModalOpen(true)}
      className={styles.actionButton}
      variant="primary"
      title={t('common.offramp-button')}
    >
      {t('common.offramp-button')}
    </Button>
  );
};
