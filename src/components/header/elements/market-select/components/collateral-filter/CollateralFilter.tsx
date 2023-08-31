import classnames from 'classnames';
import { useAtom } from 'jotai';
import { memo, MouseEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Button, Menu, MenuItem, Typography } from '@mui/material';

import { tokensIconsMap } from 'utils/tokens';

import { collateralFilterAtom, collateralsAtom, defaultCollateralFilter } from '../../collaterals.store';

import styles from './CollateralFilter.module.scss';

export const CollateralFilter = memo(() => {
  const { t } = useTranslation();

  const [collateralFilter, setCollateralFilter] = useAtom(collateralFilterAtom);
  const [collaterals] = useAtom(collateralsAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button onClick={handleClick} className={styles.root} variant="outlined">
        <div className={styles.selectedCollateral}>
          <Typography variant="bodyTiny" className={styles.label}>
            {t('common.select.collateral.label')}
          </Typography>
          <Typography variant="bodyTiny" className={styles.value}>
            {collateralFilter}
          </Typography>
        </div>
        <div className={styles.arrowDropDown}>{open ? <ArrowDropUp /> : <ArrowDropDown />}</div>
      </Button>

      <Menu
        anchorEl={anchorEl}
        id="dropdown-collaterals"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {collaterals.map((collateral) => {
          const IconComponent = tokensIconsMap[collateral.toLowerCase()]?.icon ?? tokensIconsMap.default.icon;

          return (
            <MenuItem
              key={collateral}
              onClick={() => {
                setCollateralFilter(collateral);
                handleClose();
              }}
              className={classnames(styles.menuItem, { [styles.selected]: collateralFilter === collateral })}
            >
              {collateral === defaultCollateralFilter ? (
                <span className={styles.tokenIcon} />
              ) : (
                <IconComponent className={styles.tokenIcon} />
              )}
              {collateral}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
});
