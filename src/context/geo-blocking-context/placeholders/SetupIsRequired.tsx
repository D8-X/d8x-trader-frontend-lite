import { useTranslation } from 'react-i18next';

import { Card, CardContent, Typography } from '@mui/material';

import { GeoLayout } from '../geo-layout/GeoLayout';

export const SetupIsRequired = () => {
  const { t } = useTranslation();

  return (
    <GeoLayout title="Setup is required">
      <Card>
        <CardContent>
          <Typography variant="body1">{t('pages.geolocation.setup-required')}</Typography>
        </CardContent>
      </Card>
    </GeoLayout>
  );
};
