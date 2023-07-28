import { roundToLotString } from '@d8x/perpetuals-sdk';
import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

import { Box, Typography } from '@mui/material';

import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { getMaxOrderSizeForTrader } from 'network/network';
import { orderBlockAtom, orderSizeAtom } from 'store/order-block.store';
import { perpetualStaticInfoAtom, selectedPerpetualAtom, traderAPIAtom } from 'store/pools.store';
import { sdkConnectedAtom } from 'store/vault-pools.store';
import { OrderBlockE } from 'types/enums';

import commonStyles from '../../OrderBlock.module.scss';
import styles from './OrderSize.module.scss';

export const OrderSize = memo(() => {
  const [orderSize, setOrderSize] = useAtom(orderSizeAtom);
  const [perpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [orderBlock] = useAtom(orderBlockAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);

  const [inputValue, setInputValue] = useState(`${orderSize}`);
  const [maxOrderSize, setMaxOrderSize] = useState<number | undefined>(undefined);

  const { address } = useAccount();
  const chainId = useChainId();

  const inputValueChangedRef = useRef(false);
  const traderAPIRef = useRef(traderAPI);
  const fetchedMaxSizes = useRef(false);

  const handleOrderSizeChange = useCallback(
    (orderSizeValue: string) => {
      if (orderSizeValue) {
        setOrderSize(+orderSizeValue);
        setInputValue(orderSizeValue);
      } else {
        setOrderSize(0);
        setInputValue('');
      }
      inputValueChangedRef.current = true;
    },
    [setOrderSize]
  );

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${orderSize}`);
    }
    inputValueChangedRef.current = false;
  }, [orderSize]);

  const handleInputBlur = useCallback(() => {
    if (perpetualStaticInfo) {
      const roundedValue = roundToLotString(orderSize, perpetualStaticInfo.lotSizeBC);
      setOrderSize(+roundedValue);
      setInputValue(roundedValue);
    }
  }, [perpetualStaticInfo, orderSize, setOrderSize]);

  const orderSizeStep = useMemo(() => {
    if (perpetualStaticInfo) {
      return roundToLotString(perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC);
    }
    return '0.1';
  }, [perpetualStaticInfo]);

  const minPositionString = useMemo(() => {
    if (perpetualStaticInfo) {
      return roundToLotString(10 * perpetualStaticInfo.lotSizeBC, perpetualStaticInfo.lotSizeBC);
    }
    return '0.1';
  }, [perpetualStaticInfo]);

  const fetchMaxOrderSize = useCallback(
    async (_chainId: number, _address: string, _lotSizeBC: number, _perpId: number, _isLong: boolean) => {
      if (traderAPI && !fetchedMaxSizes.current) {
        const symbol = traderAPI.getSymbolFromPerpId(_perpId);
        if (!symbol) {
          return;
        }
        fetchedMaxSizes.current = true;
        const data = await getMaxOrderSizeForTrader(_chainId, traderAPI, _address, symbol).catch((err) => {
          console.error(err);
          fetchedMaxSizes.current = false;
        });
        let maxAmount: number | undefined;
        if (_isLong) {
          maxAmount = data?.data?.buy;
        } else {
          maxAmount = data?.data?.sell;
        }
        return maxAmount === undefined ? undefined : +roundToLotString(maxAmount, _lotSizeBC);
      }
    },
    [traderAPI]
  );

  useEffect(() => {
    if (perpetualStaticInfo && address && isSDKConnected) {
      fetchMaxOrderSize(
        chainId,
        address,
        perpetualStaticInfo.lotSizeBC,
        perpetualStaticInfo.id,
        orderBlock === OrderBlockE.Long
      ).then(setMaxOrderSize);
    }
  }, [isSDKConnected, chainId, address, perpetualStaticInfo, orderBlock, fetchMaxOrderSize]);

  useEffect(() => {
    if (isSDKConnected) {
      traderAPIRef.current = traderAPI;
    }
  }, [traderAPI, isSDKConnected]);

  return (
    <Box className={styles.root}>
      <Box className={styles.label}>
        <InfoBlock
          title={'Order size'}
          content={
            <>
              <Typography> Sets the size of your order. </Typography>
              <Typography>
                Your maximal order size, based on your open positions and the state of the exchange, is {maxOrderSize}{' '}
                {selectedPerpetual?.baseCurrency}. The minimal position size for this perpetual is {minPositionString}{' '}
                {selectedPerpetual?.baseCurrency}, with a step size of {orderSizeStep} {selectedPerpetual?.baseCurrency}
                .
              </Typography>
            </>
          }
          classname={commonStyles.actionIcon}
        />
      </Box>
      <ResponsiveInput
        id="order-size"
        inputValue={inputValue}
        setInputValue={handleOrderSizeChange}
        handleInputBlur={handleInputBlur}
        currency={selectedPerpetual?.baseCurrency}
        step={orderSizeStep}
        min={0}
        max={maxOrderSize}
      />
    </Box>
  );
});
