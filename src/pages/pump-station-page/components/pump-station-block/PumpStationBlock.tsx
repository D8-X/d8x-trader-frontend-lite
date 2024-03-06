import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { Typography } from '@mui/material';

import { ReactComponent as D8XLogoWithText } from 'assets/logos/d8xLogoWithText.svg';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { getPumpStationData } from 'network/network';
import { BoostI } from 'types/types';
import { formatNumber } from 'utils/formatNumber';

import { PumpOMeter } from '../pump-o-meter/PumpOMeter';

import styles from './PumpStationBlock.module.scss';

const INTERVAL_FOR_DATA_POLLING = 10000; // Each 10 sec

export const PumpStationBlock = () => {
  const { t } = useTranslation();

  const [volumeValue, setVolumeValue] = useState<number>();
  const [boosts, setBoosts] = useState<BoostI[]>([]);

  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  const fetchData = useCallback(() => {
    if (!isConnected || !address) {
      return;
    }

    getPumpStationData(address).then((response) => {
      setVolumeValue(response.crossChainScore);
      setBoosts(response.boosts);
    });
  }, [isConnected, address]);

  useEffect(() => {
    setVolumeValue(undefined);
    setBoosts([]);

    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData();
    }, INTERVAL_FOR_DATA_POLLING);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData]);

  const boostByChainId = boosts.find((boost) => boost.chainId === chainId);
  const percent =
    boostByChainId && volumeValue
      ? Math.round(boostByChainId.nxtBoost + (boostByChainId.nxtRndBoost / volumeValue) * 10000) / 100
      : 0;

  return (
    <div className={styles.root}>
      <Typography variant="h6" sx={{ my: 2 }}>
        <D8XLogoWithText width={86} height={20} />
      </Typography>
      <div className={styles.labelHolder}>
        <InfoLabelBlock
          title={t('pages.pump-station.pumped-volume.title')}
          content={<Typography>{t('pages.pump-station.pumped-volume.modal-text')}</Typography>}
        />
      </div>
      <Typography variant="h4" className={styles.volumeValue}>
        {volumeValue !== undefined ? formatNumber(volumeValue, 0) : '--'} $
      </Typography>

      <div className={styles.labelHolder}>
        <InfoLabelBlock
          title={t('pages.pump-station.pump-o-meter.title')}
          content={<Typography>{t('pages.pump-station.pump-o-meter.modal-text')}</Typography>}
        />
      </div>
      <div className={styles.meterHolder}>
        <PumpOMeter percent={percent} />
      </div>
    </div>
  );
};
