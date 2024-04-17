import classnames from 'classnames';
import { useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@mui/material';

import { liquidityTypeAtom } from 'store/vault-pools.store';
import { LiquidityTypeE } from 'types/enums';

import styles from './LiquidityTypeSelector.module.scss';

const mapButtonName: Record<LiquidityTypeE, string> = {
  [LiquidityTypeE.Add]: 'pages.vault.add.button',
  [LiquidityTypeE.Withdraw]: 'pages.vault.withdraw.action.button',
};

export const LiquidityTypeSelector = memo(() => {
  const { t } = useTranslation();

  const [liquidityType, setLiquidityType] = useAtom(liquidityTypeAtom);

  return (
    <div className={styles.root}>
      {Object.values(LiquidityTypeE).map((key) => (
        <Button
          key={key}
          className={classnames({ [styles.selected]: key === liquidityType })}
          variant="link"
          onClick={() => setLiquidityType(key)}
        >
          {t(mapButtonName[LiquidityTypeE[key]])}
        </Button>
      ))}
    </div>
  );
});
