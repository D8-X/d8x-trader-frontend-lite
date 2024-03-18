import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { Bolt, Casino } from '@mui/icons-material';
import { Typography } from '@mui/material';

import D8XLogoWithText from 'assets/logos/d8xLogoWithText.svg?react';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { getPumpStationData, getPumpStationParameters } from 'network/network';
import { BoostI, PumpStationParamResponseI } from 'types/types';
import { formatNumber } from 'utils/formatNumber';

import { PumpOMeter } from '../pump-o-meter/PumpOMeter';

import styles from './PumpStationBlock.module.scss';

const INTERVAL_FOR_DATA_POLLING = 10000; // Each 10 sec

export const PumpStationBlock = memo(() => {
  const { t } = useTranslation();

  const [volumeValue, setVolumeValue] = useState<number>();
  const [pumpValue, setPumpValue] = useState<number>();
  const [boosts, setBoosts] = useState<BoostI[]>([]);
  const [pumpStationParams, setPumpStationParams] = useState<PumpStationParamResponseI>();

  const isDataRequestSent = useRef(false);
  const isParamsRequestSent = useRef(false);

  const chainId = useChainId();
  const { address, isConnected } = useAccount();

  const fetchData = useCallback(() => {
    if (!isConnected || !address || isDataRequestSent.current) {
      return;
    }

    isDataRequestSent.current = true;

    getPumpStationData(address)
      .then((response) => {
        setVolumeValue(response.crossChainScore);
        setPumpValue(response.lastBoostedVol);
        setBoosts(response.boosts);
      })
      .finally(() => {
        isDataRequestSent.current = false;
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

  useEffect(() => {
    if (!isParamsRequestSent.current) {
      isParamsRequestSent.current = true;

      getPumpStationParameters()
        .then(setPumpStationParams)
        .finally(() => {
          isParamsRequestSent.current = false;
        });
    }
  }, []);

  const boostByChainId = boosts.find((boost) => boost.chainId === chainId);
  const totalBoost = boostByChainId ? boostByChainId.nxtBoost + boostByChainId.nxtRndBoost : 0;

  return (
    <div className={styles.root}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        <D8XLogoWithText width={86} height={20} />
      </Typography>
      <div className={styles.firstComponent}>
        <div className={styles.subComponent}>
          <div className={styles.labelHolder}>
            <InfoLabelBlock
              title={t('pages.pump-station.pumped-volume.title')}
              content={<Typography>{t('pages.pump-station.pumped-volume.modal-text')}</Typography>}
            />
          </div>
          <Typography variant="h4" className={styles.volumeValue}>
            $ {volumeValue !== undefined ? formatNumber(volumeValue, 0) : '--'}
          </Typography>
        </div>
        <div className={styles.subComponent}>
          <div className={styles.labelHolder}>
            <InfoLabelBlock
              title={t('pages.pump-station.last-pump.title')}
              content={<Typography>{t('pages.pump-station.last-pump.modal-text')}</Typography>}
            />
          </div>
          <Typography variant="h4" className={styles.volumeValue}>
            + $ {pumpValue !== undefined ? formatNumber(pumpValue, 0) : '--'}
          </Typography>
        </div>
      </div>
      <div className={styles.labelHolder}>
        <InfoLabelBlock
          title={t('pages.pump-station.pump-o-meter.title')}
          content={
            <Typography>
              {t('pages.pump-station.pump-o-meter.modal-text', {
                totalBoostMax: (pumpStationParams?.volBoostMax ?? 0) + (pumpStationParams?.rndBoostMax ?? 0),
              })}
              <ol>
                <li>
                  {t('pages.pump-station.pump-o-meter.modal-text2', { volBoostMax: pumpStationParams?.volBoostMax })}
                </li>
                <li>
                  {t('pages.pump-station.pump-o-meter.modal-text3', { rndBoostMax: pumpStationParams?.rndBoostMax })}
                </li>
              </ol>
            </Typography>
          }
        />
      </div>
      <div className={styles.meterHolder}>
        <PumpOMeter totalBoost={totalBoost} />
      </div>
      <div className={styles.boostsData}>
        <div className={styles.boostLine}>
          <Bolt fontSize="small" />
          <span>
            {t('pages.pump-station.boost.volume')} {boostByChainId?.nxtBoost ? `${boostByChainId.nxtBoost}x` : '0'}
          </span>
        </div>
        <div className={styles.boostLine}>
          <Casino fontSize="small" />
          <span>
            {t('pages.pump-station.boost.random')}{' '}
            {boostByChainId?.nxtRndBoost ? `${boostByChainId.nxtRndBoost}x` : '0'}
          </span>
        </div>
      </div>
    </div>
  );
});
