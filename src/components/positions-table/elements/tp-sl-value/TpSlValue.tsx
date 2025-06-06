import { TraderInterface } from '@d8x/perpetuals-sdk';
import { useAtomValue } from 'jotai';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { IconButton, Typography } from '@mui/material';
import { ModeEditOutlineOutlined } from '@mui/icons-material';

import { parseSymbol } from 'helpers/parseSymbol';
import { perpetualStaticInfoAtom } from 'store/pools.store';
import { OrderSideE, OrderValueTypeE } from 'types/enums';
import { MarginAccountWithAdditionalDataI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './TpSlValue.module.scss';
import { calculateProbability } from '../../../../helpers/calculateProbability';

interface TpSlValuePropsI {
  position: MarginAccountWithAdditionalDataI;
  handleTpSlModify: (position: MarginAccountWithAdditionalDataI) => void;
}

interface OpenOrdersDataI {
  takeProfit: {
    className: string;
    value: string;
  };
  stopLoss: {
    className: string;
    value: string;
  };
}

const defaultOpenOrdersData: OpenOrdersDataI = {
  takeProfit: {
    className: '',
    value: '---',
  },
  stopLoss: {
    className: '',
    value: '---',
  },
};

const TEXTUAL_VALUE_TYPES = [OrderValueTypeE.Multiple, OrderValueTypeE.Partial, OrderValueTypeE.Exceeded];

export const TpSlValue = memo(({ position, handleTpSlModify }: TpSlValuePropsI) => {
  const { t } = useTranslation();

  const perpetualStaticInfo = useAtomValue(perpetualStaticInfoAtom);

  const parsedSymbol = parseSymbol(position.symbol);

  const isPredictionMarket = useMemo(() => {
    try {
      return !!perpetualStaticInfo && TraderInterface.isPredictionMarketStatic(perpetualStaticInfo);
    } catch {
      // skip
    }
  }, [perpetualStaticInfo]);

  const openOrdersData: OpenOrdersDataI = useMemo(() => {
    const ordersData = {
      takeProfit: {
        ...defaultOpenOrdersData.takeProfit,
      },
      stopLoss: {
        ...defaultOpenOrdersData.stopLoss,
      },
    };
    if (position.takeProfit.valueType !== OrderValueTypeE.None) {
      ordersData.takeProfit.className = styles.tpValue;
      if (TEXTUAL_VALUE_TYPES.includes(position.takeProfit.valueType)) {
        ordersData.takeProfit.value = t(`pages.trade.positions-table.table-content.${position.takeProfit.valueType}`);
      } else {
        ordersData.takeProfit.value = formatToCurrency(
          isPredictionMarket && position.takeProfit.fullValue !== undefined
            ? calculateProbability(position.takeProfit.fullValue, position.side === OrderSideE.Sell)
            : position.takeProfit.fullValue,
          isPredictionMarket ? '%' : parsedSymbol?.quoteCurrency,
          true
        );
      }
    }

    if (position.stopLoss.valueType !== OrderValueTypeE.None) {
      ordersData.stopLoss.className = styles.slValue;
      if (TEXTUAL_VALUE_TYPES.includes(position.stopLoss.valueType)) {
        ordersData.stopLoss.value = t(`pages.trade.positions-table.table-content.${position.stopLoss.valueType}`);
      } else {
        ordersData.stopLoss.value = formatToCurrency(
          isPredictionMarket && position.stopLoss.fullValue !== undefined
            ? calculateProbability(position.stopLoss.fullValue, position.side === OrderSideE.Sell)
            : position.stopLoss.fullValue,
          isPredictionMarket ? '%' : parsedSymbol?.quoteCurrency,
          true
        );
      }
    }

    return ordersData;
  }, [t, position, parsedSymbol, isPredictionMarket]);

  return (
    <div className={styles.root}>
      <div>
        <Typography variant="cellSmall" component="div" className={openOrdersData.takeProfit.className}>
          {openOrdersData.takeProfit.value}
        </Typography>
        <Typography variant="cellSmall" component="div" className={openOrdersData.stopLoss.className}>
          {openOrdersData.stopLoss.value}
        </Typography>
      </div>
      <div>
        <IconButton
          aria-label={t('pages.trade.positions-table.table-content.modify')}
          title={t('pages.trade.positions-table.table-content.modify')}
          onClick={() => handleTpSlModify(position)}
          className={styles.iconButton}
        >
          <ModeEditOutlineOutlined className={styles.actionIcon} />
        </IconButton>
      </div>
    </div>
  );
});
