import { useTranslation } from 'react-i18next';

import { Typography } from '@mui/material';

import D8XLogoWithText from 'assets/logos/d8xLogoWithText.svg?react';
import { InfoLabelBlock } from 'components/info-label-block/InfoLabelBlock';

import styles from './PumpStationBlock.module.scss';
import { PumpOMeter } from '../pump-o-meter/PumpOMeter';

export const PumpStationBlock = () => {
  const { t } = useTranslation();

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
        500,000 $
      </Typography>

      <div className={styles.labelHolder}>
        <InfoLabelBlock
          title={t('pages.pump-station.pump-o-meter.title')}
          content={<Typography>{t('pages.pump-station.pump-o-meter.modal-text')}</Typography>}
        />
      </div>
      <div className={styles.meterHolder}>
        <PumpOMeter percent={10} />
      </div>
    </div>
  );
};
