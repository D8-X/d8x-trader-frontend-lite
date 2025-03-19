import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { X } from '@mui/icons-material';
import { Link, Typography } from '@mui/material';

import { Translate } from 'components/translate/Translate';
import { getMaintenanceStatus } from 'network/network';
import { MaintenanceStatusI } from 'types/types';

import styles from './MaintenanceWrapper.module.scss';

const INTERVAL_FOR_DATA_POLLING = 60000; // Each 60 sec

export const MaintenanceWrapper = ({ children }: PropsWithChildren) => {
  const { t } = useTranslation();

  const { chain } = useAccount();

  const [maintenanceStatuses, setMaintenanceStatuses] = useState<MaintenanceStatusI[]>([]);

  const isRequestSent = useRef(false);

  const fetchMaintenanceStatus = useCallback(() => {
    if (isRequestSent.current) {
      return;
    }

    isRequestSent.current = true;

    getMaintenanceStatus()
      .then((response) => {
        setMaintenanceStatuses(response);
      })
      .catch((error) => {
        console.error(error);
        setMaintenanceStatuses([]);
      })
      .finally(() => {
        isRequestSent.current = false;
      });
  }, []);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, [fetchMaintenanceStatus]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchMaintenanceStatus();
    }, INTERVAL_FOR_DATA_POLLING);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchMaintenanceStatus]);

  const isMaintenanceMode = useMemo(() => {
    if (maintenanceStatuses.length === 0 || !chain?.id) {
      return false;
    }
    const foundStatus = maintenanceStatuses.find((status) => status.chainId === chain.id);
    if (foundStatus) {
      return false; //TODO: remove this and comment next line in.
      //return foundStatus.isMaintenance;
    }
    return false;
  }, [chain, maintenanceStatuses]);

  if (!isMaintenanceMode || !chain) {
    return children;
  }

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Typography variant="h5" className={styles.title}>
          {t('common.maintenance-mode.header')}
        </Typography>
        <Typography variant="bodyMedium" className={styles.description}>
          <Translate i18nKey={'common.maintenance-mode.description'} values={{ chainName: chain.name }} />
        </Typography>
        <Typography variant="bodyMedium" className={styles.visitText}>
          {t('common.maintenance-mode.visit-text.1')}
          <Link
            href="https://twitter.com/d8x_exchange"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.chainIcon}
          >
            <X />
          </Link>
          {t('common.maintenance-mode.visit-text.2')}
        </Typography>
      </div>
    </div>
  );
};
