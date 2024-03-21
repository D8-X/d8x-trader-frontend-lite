import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

import { ArrowForward } from '@mui/icons-material';
import { Link, Typography } from '@mui/material';

import { pagesConfig } from 'config';
import { QueryParamE, ReferTabIdE } from 'pages/refer-page/constants';
import { RoutesE } from 'routes/RoutesE';

import styles from './Overview.module.scss';

export const Overview = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={styles.root}>
      <Typography variant="h4" className={styles.title}>
        {t('pages.boost-station.title')}
      </Typography>
      {pagesConfig.enabledReferPage && (
        <div className={styles.inviteLink}>
          <Link onClick={() => navigate(`${RoutesE.Refer}?${QueryParamE.Tab}=${ReferTabIdE.Referral}${location.hash}`)}>
            <ArrowForward fontSize="small" />
            {t('pages.boost-station.invite-friends')}
          </Link>
        </div>
      )}
    </div>
  );
};
