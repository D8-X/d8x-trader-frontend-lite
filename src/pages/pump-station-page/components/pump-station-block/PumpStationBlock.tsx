import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { Bolt, Casino } from '@mui/icons-material';
import { Typography } from '@mui/material';

import D8XLogoWithText from 'assets/logos/d8xLogoWithText.svg?react';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';
import { getPumpStationData, getPumpStationParameters } from 'network/network';
import { BoostI, BoostStationResponseI, PumpStationParamResponseI } from 'types/types';
import { formatNumber } from 'utils/formatNumber';

import { PumpOMeter } from '../pump-o-meter/PumpOMeter';

import styles from './PumpStationBlock.module.scss';

const INTERVAL_FOR_DATA_POLLING = 10_000; // Each 10 sec

export const PumpStationBlock = memo(() => {
  const { t } = useTranslation();

  const [boostStation, setBoostStation] = useState<BoostStationResponseI>();
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
        setBoostStation(response);
        setBoosts(response.boosts);
      })
      .finally(() => {
        isDataRequestSent.current = false;
      });
  }, [isConnected, address]);

  useEffect(() => {
    setBoostStation(undefined);
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
      <div>
        <div className={styles.labelHolder}>
          <InfoLabelBlock
            title={t('pages.boost-station.boosted-volume.title')}
            content={<Typography>{t('pages.boost-station.boosted-volume.modal-text')}</Typography>}
          />
        </div>
        <Typography variant="h4" className={styles.valueHolder}>
          $ {boostStation ? formatNumber(boostStation.crossChainScore, 0) : '--'}
        </Typography>
      </div>
      <div className={styles.boostsHolder}>
        <div className={styles.boostBlock}>
          <div className={styles.metricsBlock}>
            <div className={styles.longMetric}>
              <div className={styles.labelHolder}>
                <InfoLabelBlock
                  title={t('pages.boost-station.trade-volume.title')}
                  content={<Typography>{t('pages.boost-station.trade-volume.modal-text')}</Typography>}
                />
              </div>
              <Typography variant="h6" className={styles.valueHolder}>
                $ {boostStation ? formatNumber(boostStation.boostedTraderVol, 0) : '--'}
              </Typography>
            </div>
            <div className={styles.shortMetric}>
              <div className={styles.labelHolder}>
                <InfoLabelBlock
                  title={t('pages.boost-station.trade-last-increase.title')}
                  content={<Typography>{t('pages.boost-station.trade-last-increase.modal-text')}</Typography>}
                />
              </div>
              <Typography variant="h6" className={styles.valueHolder}>
                + $ {boostStation ? formatNumber(boostStation.lastBoostedVol, 0) : '--'}
              </Typography>
            </div>
          </div>
          <div className={styles.meterHolder}>
            <div className={styles.labelHolder}>
              <InfoLabelBlock
                title={t('pages.boost-station.trade-boost.title')}
                content={
                  <Typography>
                    {t('pages.boost-station.trade-boost.modal-text', {
                      totalBoostMax: (pumpStationParams?.volBoostMax ?? 0) + (pumpStationParams?.rndBoostMax ?? 0),
                    })}
                    <ol>
                      <li>
                        {t('pages.boost-station.trade-boost.modal-text2', {
                          volBoostMax: pumpStationParams?.volBoostMax,
                        })}
                      </li>
                      <li>
                        {t('pages.boost-station.trade-boost.modal-text3', {
                          rndBoostMax: pumpStationParams?.rndBoostMax,
                        })}
                      </li>
                    </ol>
                  </Typography>
                }
              />
            </div>
            <PumpOMeter totalBoost={totalBoost} />
          </div>
          <div className={styles.boostsData}>
            <div className={styles.boostLine}>
              <Bolt fontSize="small" style={{ color: 'var(--d8x-color-action)' }} />
              <span>
                {t('pages.boost-station.boost.volume')} {boostByChainId?.nxtBoost ? `${boostByChainId.nxtBoost}x` : '0'}
              </span>
            </div>
            <div className={styles.boostLine}>
              <Casino fontSize="small" style={{ color: 'var(--d8x-color-action)' }} />
              <span>
                {t('pages.boost-station.boost.random')}{' '}
                {boostByChainId?.nxtRndBoost ? `${boostByChainId.nxtRndBoost}x` : '0'}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.boostBlock}>
          <div className={styles.metricsBlock}>
            <div className={styles.longMetric}>
              <div className={styles.labelHolder}>
                <InfoLabelBlock
                  title={t('pages.boost-station.liquidity-volume.title')}
                  content={<Typography>{t('pages.boost-station.liquidity-volume.modal-text')}</Typography>}
                />
              </div>
              <Typography variant="h6" className={styles.valueHolder}>
                $ {boostStation ? formatNumber(boostStation.boostedLpVol, 0) : '--'}
              </Typography>
            </div>
            <div className={styles.shortMetric}>
              <div className={styles.labelHolder}>
                <InfoLabelBlock
                  title={t('pages.boost-station.trade-hourly-increase.title')}
                  content={<Typography>{t('pages.boost-station.trade-hourly-increase.modal-text')}</Typography>}
                />
              </div>
              <Typography variant="h6" className={styles.valueHolder}>
                + $ {boostStation ? formatNumber(boostStation.hourlyLPBVolIncrease, 0) : '--'}
              </Typography>
            </div>
          </div>
          <div className={styles.meterHolder}>
            <div className={styles.labelHolder}>
              <InfoLabelBlock
                title={t('pages.boost-station.liquidity-boost.title')}
                content={
                  <Typography>
                    {t('pages.boost-station.liquidity-boost.modal-text', {
                      totalBoostMax: (pumpStationParams?.volBoostMax ?? 0) + (pumpStationParams?.rndBoostMax ?? 0),
                    })}
                  </Typography>
                }
              />
            </div>
            <div className={styles.meterHolder}>
              <PumpOMeter totalBoost={boostStation ? boostStation.poolVolBoost[0].boost : 0} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
