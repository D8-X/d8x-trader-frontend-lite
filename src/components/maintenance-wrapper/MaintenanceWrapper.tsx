import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetwork } from 'wagmi';

import { Typography } from '@mui/material';

import { Translate } from 'components/translate/Translate';
import { getMaintenanceStatus } from 'network/network';

import styles from './MaintenanceWrapper.module.scss';

export const MaintenanceWrapper = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();

  const { chain } = useNetwork();

  const [isMaintenanceMode, setMaintenanceMode] = useState(false);

  const isRequestSent = useRef(false);

  const fetchMaintenanceStatus = useCallback(() => {
    if (isRequestSent.current || !chain?.id) {
      return;
    }

    isRequestSent.current = true;

    getMaintenanceStatus(chain.id)
      .then((response) => {
        setMaintenanceMode(response.data);
      })
      .catch((error) => {
        console.error(error);
        setMaintenanceMode(false);
      })
      .finally(() => {
        isRequestSent.current = false;
      });
  }, [chain]);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, [fetchMaintenanceStatus]);

  if (!isMaintenanceMode || !chain) {
    return children;
  }

  return (
    <div className={styles.root}>
      <Typography variant="h5" className={styles.title}>
        {t('common.maintenance-mode.header')}
      </Typography>
      <Typography variant="bodyMedium" className={styles.description}>
        <Translate i18nKey={'common.maintenance-mode.description'} values={{ chainName: chain.name }} />
      </Typography>
      <Typography variant="bodyMedium" className={styles.visitText}>
        {t('common.maintenance-mode.visit-text.1')}
        <img
          src={(chain as { iconUrl?: string }).iconUrl}
          alt={chain.name}
          className={styles.chainIcon}
          width={22}
          height={22}
        />
        {t('common.maintenance-mode.visit-text.2')}
      </Typography>
    </div>
  );
};
