import { useAtom } from 'jotai';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useChainId, useSigner } from 'wagmi';
import { Separator } from 'components/separator/Separator';

import { Box, Button, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { SidesRow } from 'components/sides-row/SidesRow';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getMaxOrderSizeForTrader, orderDigest, positionRiskOnTrade } from 'network/network';
import { clearInputsDataAtom, orderInfoAtom } from 'store/order-block.store';
import {
  collateralDepositAtom,
  newPositionRiskAtom,
  perpetualStaticInfoAtom,
  poolTokenBalanceAtom,
  positionsAtom,
  proxyAddrAtom,
  selectedPerpetualAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { OrderBlockE, OrderTypeE, StopLossE, TakeProfitE } from 'types/enums';
import { MaxOrderSizeResponseI, OrderI, OrderInfoI } from 'types/types';
import { formatNumber } from 'utils/formatNumber';
import { formatToCurrency } from 'utils/formatToCurrency';
import { mapExpiryToNumber } from 'utils/mapExpiryToNumber';

import styles from './ActionBlock.module.scss';
import { useDebounce } from 'helpers/useDebounce';
import { toUtf8String } from '@ethersproject/strings';
import { HashZero } from '@ethersproject/constants';

const orderBlockMap: Record<OrderBlockE, string> = {
  [OrderBlockE.Long]: 'Buy',
  [OrderBlockE.Short]: 'Sell',
};

const SECONDARY_DEADLINE_MULTIPLIER = 24 * 1825;

function createMainOrder(orderInfo: OrderInfoI) {
  let orderType = orderInfo.orderType.toUpperCase();
  if (orderInfo.orderType === OrderTypeE.Stop) {
    orderType = orderInfo.limitPrice !== null && orderInfo.limitPrice > -1 ? 'STOP_LIMIT' : 'STOP_MARKET';
  }

  let limitPrice = orderInfo.limitPrice;
  if (orderInfo.orderType === OrderTypeE.Market) {
    limitPrice = orderInfo.maxMinEntryPrice;
  }

  let deadlineMultiplier = 200; // By default, is it set to 200 hours
  if (orderInfo.orderType !== OrderTypeE.Market && orderInfo.expireDays) {
    deadlineMultiplier = 24 * mapExpiryToNumber(orderInfo.expireDays);
  }

  return {
    symbol: orderInfo.symbol,
    side: orderInfo.orderBlock === OrderBlockE.Long ? 'BUY' : 'SELL',
    type: orderType,
    limitPrice: limitPrice !== null && limitPrice > -1 ? limitPrice : undefined,
    stopPrice: orderInfo.triggerPrice !== null ? orderInfo.triggerPrice : undefined,
    quantity: orderInfo.size,
    leverage: orderInfo.leverage,
    reduceOnly: orderInfo.reduceOnly !== null ? orderInfo.reduceOnly : undefined,
    keepPositionLvg: orderInfo.keepPositionLeverage,
    executionTimestamp: 0,
    deadline: Math.floor(Date.now() / 1000 + 60 * 60 * deadlineMultiplier),
  };
}

export const ActionBlock = memo(() => {
  const { address } = useAccount();
  const chainId = useChainId();

  const { data: signer } = useSigner({
    onError(error) {
      console.log(error);
    },
  });

  const [orderInfo] = useAtom(orderInfoAtom);
  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [selectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [selectedPerpetualStaticInfo] = useAtom(perpetualStaticInfoAtom);
  const [newPositionRisk, setNewPositionRisk] = useAtom(newPositionRiskAtom);
  const [positions] = useAtom(positionsAtom);
  const [collateralDeposit, setCollateralDeposit] = useAtom(collateralDepositAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [poolTokenBalance] = useAtom(poolTokenBalanceAtom);
  const [, clearInputsData] = useAtom(clearInputsDataAtom);

  const [showReviewOrderModal, setShowReviewOrderModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [maxOrderSize, setMaxOrderSize] = useState<MaxOrderSizeResponseI>();

  const requestSentRef = useRef(false);
  const traderAPIRef = useRef(traderAPI);

  useEffect(() => {
    traderAPIRef.current = traderAPI;
  });

  const openReviewOrderModal = useCallback(async () => {
    if (!orderInfo || !address) {
      return;
    }

    setShowReviewOrderModal(true);
    setNewPositionRisk(null);

    const mainOrder = createMainOrder(orderInfo);
    await positionRiskOnTrade(
      chainId,
      traderAPIRef.current,
      mainOrder,
      address,
      positions?.find((pos) => pos.symbol === orderInfo.symbol)
    ).then((data) => {
      setNewPositionRisk(data.data.newPositionRisk);
      setCollateralDeposit(data.data.orderCost);
    });

    setMaxOrderSize(undefined);
    await getMaxOrderSizeForTrader(chainId, traderAPIRef.current, mainOrder, address, Date.now()).then((data) => {
      setMaxOrderSize(data.data);
    });
  }, [orderInfo, chainId, address, positions, setNewPositionRisk, setCollateralDeposit]);

  const closeReviewOrderModal = useCallback(() => {
    setShowReviewOrderModal(false);
  }, []);

  const isBuySellButtonActive = useMemo(() => {
    if (!orderInfo || !address) {
      return false;
    }
    if (!orderInfo.size) {
      return false;
    }
    if (orderInfo.orderType === OrderTypeE.Limit && (orderInfo.limitPrice === null || orderInfo.limitPrice <= 0)) {
      return false;
    }
    return !(orderInfo.orderType === OrderTypeE.Stop && (!orderInfo.triggerPrice || orderInfo.triggerPrice <= 0));
  }, [orderInfo, address]);

  const parsedOrders = useMemo(() => {
    if (requestSentRef.current || requestSent) {
      return;
    }

    if (!isBuySellButtonActive) {
      return;
    }

    if (!address || !orderInfo || !selectedPool || !proxyAddr) {
      return;
    }

    const orders: OrderI[] = [];

    orders.push(createMainOrder(orderInfo));

    if (orderInfo.stopLoss !== StopLossE.None && orderInfo.stopLossPrice) {
      orders.push({
        // Changed values comparing to main Order
        side: orderInfo.orderBlock === OrderBlockE.Long ? 'SELL' : 'BUY',
        type: 'STOP_MARKET',
        stopPrice: orderInfo.stopLossPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: orderInfo.symbol,
        quantity: orderInfo.size,
        leverage: orderInfo.leverage,
        reduceOnly: orderInfo.reduceOnly !== null ? orderInfo.reduceOnly : undefined,
        keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: 0,
      });
    }

    if (orderInfo.takeProfit !== TakeProfitE.None && orderInfo.takeProfitPrice) {
      orders.push({
        // Changed values comparing to main Order
        side: orderInfo.orderBlock === OrderBlockE.Long ? 'SELL' : 'BUY',
        type: OrderTypeE.Limit.toUpperCase(),
        limitPrice: orderInfo.takeProfitPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: orderInfo.symbol,
        quantity: orderInfo.size,
        leverage: orderInfo.leverage,
        reduceOnly: orderInfo.reduceOnly !== null ? orderInfo.reduceOnly : undefined,
        keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: 0,
      });
    }
    return orders;
  }, [orderInfo, selectedPool, address, proxyAddr, requestSent, isBuySellButtonActive]);

  const handleOrderConfirm = useCallback(async () => {
    if (!address || !signer || !parsedOrders || !selectedPool || !proxyAddr) {
      return;
    }
    setRequestSent(true);
    requestSentRef.current = true;
    await orderDigest(chainId, parsedOrders, address)
      .then((data) => {
        if (data.data.digests.length > 0) {
          approveMarginToken(signer, selectedPool.marginTokenAddr, proxyAddr, collateralDeposit)
            .then((res) => {
              if (res?.hash) {
                console.log(res.hash);
              }
              // trader doesn't need to sign if sending his own orders: signatures are dummy zero hashes
              const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
              postOrder(signer, signatures, data.data)
                .then((tx) => {
                  // success submitting to mempool
                  console.log(`postOrder tx hash: ${tx.hash}`);
                  setShowReviewOrderModal(false);
                  toast.success(<ToastContent title="Order submit processed" bodyLines={[]} />);
                  clearInputsData();
                  // release lock
                  requestSentRef.current = false;
                  setRequestSent(false);
                  tx.wait()
                    .then((receipt) => {
                      // can't use this since backend will send a websocket message in case of success
                      // if (receipt.status === 1) {
                      //   toast.success(<ToastContent title="Order submitted" bodyLines={[]} />);
                      // }
                      if (receipt.status !== 1) {
                        toast.error(<ToastContent title="Transaction failed" bodyLines={[]} />);
                      }
                    })
                    .catch(async (err) => {
                      console.log(err);
                      const response = await signer.call(
                        {
                          to: tx.to,
                          from: tx.from,
                          nonce: tx.nonce,
                          gasLimit: tx.gasLimit,
                          gasPrice: tx.gasPrice,
                          data: tx.data,
                          value: tx.value,
                          chainId: tx.chainId,
                          type: tx.type ?? undefined,
                          accessList: tx.accessList,
                        },
                        tx.blockNumber
                      );
                      const reason = toUtf8String('0x' + response.substring(138)).replace(/\0/g, '');
                      requestSentRef.current = false;
                      setRequestSent(false);
                      toast.error(
                        <ToastContent title="Error posting order" bodyLines={[{ label: 'Reason', value: reason }]} />
                      );
                    });
                })
                .catch(async (error) => {
                  // user rejected posting
                  requestSentRef.current = false;
                  setRequestSent(false);
                  console.error(error);
                });
            })
            .catch(async (error) => {
              // user rejecting approving margin
              requestSentRef.current = false;
              setRequestSent(false);
              console.error(error);
            });
        }
      })
      .catch(async (error) => {
        toast.error(<ToastContent title="Error posting order" bodyLines={[{ label: 'Reason', value: error }]} />);
        // release lock
        requestSentRef.current = false;
        setRequestSent(false);
        console.error(error);
      });
  }, [parsedOrders, chainId, address, signer, selectedPool, proxyAddr, collateralDeposit, clearInputsData]);

  const atPrice = useMemo(() => {
    if (orderInfo) {
      let price = orderInfo.midPrice;
      if (orderInfo.orderType === OrderTypeE.Limit && orderInfo.limitPrice) {
        price = orderInfo.limitPrice;
      } else if (orderInfo.orderType === OrderTypeE.Stop && orderInfo.triggerPrice) {
        price = orderInfo.triggerPrice;
      }
      return formatToCurrency(price, orderInfo.quoteCurrency);
    }
    return '-';
  }, [orderInfo]);

  const isMarketClosed = useDebounce(
    useMemo(() => {
      return selectedPerpetual && selectedPerpetual.isMarketClosed;
    }, [selectedPerpetual]),
    30_000
  );

  const positionToModify = useDebounce(
    useMemo(() => {
      return positions?.find((pos) => pos.symbol === orderInfo?.symbol);
    }, [positions, orderInfo?.symbol]),
    1_000
  );

  const validityCheckText = useMemo(() => {
    if (!maxOrderSize || !orderInfo?.orderBlock || !selectedPerpetualStaticInfo) {
      return '-';
    }
    if (isMarketClosed) {
      return 'Warning: Market is closed';
    }
    let isTooLarge;
    if (orderInfo.orderBlock === OrderBlockE.Long) {
      isTooLarge = orderInfo.size > maxOrderSize.buy;
    } else {
      isTooLarge = orderInfo.size > maxOrderSize.sell;
    }
    if (isTooLarge) {
      return 'Order will fail: order size is too large';
    }
    const isOrderTooSmall = orderInfo.size > 0 && orderInfo.size < selectedPerpetualStaticInfo.lotSizeBC;
    if (isOrderTooSmall) {
      return 'Order will fail: order size is too small';
    }
    const isPositonTooSmall =
      (!positionToModify || positionToModify.positionNotionalBaseCCY === 0) &&
      orderInfo.size < 10 * selectedPerpetualStaticInfo.lotSizeBC;
    if (isPositonTooSmall && orderInfo.orderType === OrderTypeE.Market) {
      return 'Order will fail: resulting position too small';
    } else if (
      orderInfo.size < 10 * selectedPerpetualStaticInfo.lotSizeBC &&
      orderInfo.orderType !== OrderTypeE.Market
    ) {
      return 'Warning: order size below minimal position size';
    }
    if (
      orderInfo.orderType === OrderTypeE.Market &&
      (poolTokenBalance === undefined || poolTokenBalance < collateralDeposit)
    ) {
      return `Order will fail: insufficient wallet balance ${poolTokenBalance}`;
    }
    return 'Good to go';
  }, [
    maxOrderSize,
    orderInfo?.size,
    orderInfo?.orderBlock,
    orderInfo?.orderType,
    selectedPerpetualStaticInfo,
    poolTokenBalance,
    isMarketClosed,
    collateralDeposit,
    positionToModify,
  ]);

  const isOrderValid = useMemo(() => {
    return (
      validityCheckText === 'Good to go' ||
      validityCheckText === 'Market is closed' ||
      /Warning/.test(validityCheckText)
    );
  }, [validityCheckText]);

  const isConfirmButtonDisabled = useMemo(() => {
    return !isOrderValid || requestSentRef.current || requestSent;
  }, [isOrderValid, requestSent]);

  return (
    <Box className={styles.root}>
      <Button
        variant={orderInfo?.orderBlock === OrderBlockE.Short ? 'sell' : 'buy'}
        disabled={!isBuySellButtonActive}
        onClick={openReviewOrderModal}
        className={styles.buyButton}
      >
        {orderBlockMap[orderInfo?.orderBlock ?? OrderBlockE.Long]}{' '}
        {(orderInfo?.orderType ?? OrderTypeE.Market).toLowerCase()}
      </Button>
      {orderInfo && (
        <Dialog open={showReviewOrderModal} className={styles.dialog}>
          <DialogTitle>Review order</DialogTitle>
          <Box className={styles.emphasis}>
            <SidesRow
              leftSide={
                <Typography variant="bodyLarge" className={styles.semibold}>
                  {orderInfo.leverage > 0 ? `${formatNumber(orderInfo.leverage)}x` : ''} {orderInfo.orderType}{' '}
                  {orderBlockMap[orderInfo.orderBlock]}
                </Typography>
              }
              rightSide={
                <Typography variant="bodyLarge" className={styles.semibold}>
                  {orderInfo.size} {orderInfo.baseCurrency} @ {atPrice}
                </Typography>
              }
            />
          </Box>
          <DialogContent>
            <Box className={styles.orderDetails}>
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Trading fee:{' '}
                  </Typography>
                }
                rightSide={orderInfo.tradingFee ? formatToCurrency(orderInfo.tradingFee, 'bps', 1) : '-'}
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Deposit from wallet:{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && collateralDeposit >= 0 ? formatToCurrency(collateralDeposit, orderInfo.poolName) : '-'
                }
              />
              {orderInfo.maxMinEntryPrice !== null && (
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmall" className={styles.left}>
                      {orderInfo.orderBlock === OrderBlockE.Long ? 'Max' : 'Min'} entry price:
                    </Typography>
                  }
                  rightSide={formatToCurrency(orderInfo.maxMinEntryPrice, orderInfo.quoteCurrency)}
                />
              )}
              {orderInfo.triggerPrice !== null && (
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmall" className={styles.left}>
                      {' '}
                      Trigger price:{' '}
                    </Typography>
                  }
                  rightSide={formatToCurrency(orderInfo.triggerPrice, orderInfo.quoteCurrency)}
                />
              )}
              {orderInfo.limitPrice !== null && (
                <SidesRow
                  leftSide={
                    <Typography variant="bodySmall" className={styles.left}>
                      {' '}
                      Limit price:{' '}
                    </Typography>
                  }
                  rightSide={
                    orderInfo.limitPrice > -1 ? formatToCurrency(orderInfo.limitPrice, orderInfo.quoteCurrency) : '-'
                  }
                />
              )}
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Stop-loss:{' '}
                  </Typography>
                }
                rightSide={
                  !orderInfo.stopLossPrice ? '-' : formatToCurrency(orderInfo.stopLossPrice, orderInfo.quoteCurrency)
                }
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Take-profit:{' '}
                  </Typography>
                }
                rightSide={
                  !orderInfo.takeProfitPrice
                    ? '-'
                    : formatToCurrency(orderInfo.takeProfitPrice, orderInfo.quoteCurrency)
                }
              />
            </Box>
          </DialogContent>
          <Separator />
          <DialogContent>
            <Box className={styles.newPositionHeader}>
              <Typography variant="bodyMedium" className={styles.bold}>
                New position details
              </Typography>
            </Box>
            <Box className={styles.newPositionDetails}>
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Position size:{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && newPositionRisk
                    ? formatToCurrency(newPositionRisk.positionNotionalBaseCCY, orderInfo.baseCurrency)
                    : '-'
                }
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Margin:{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && newPositionRisk && newPositionRisk.collateralCC >= 0
                    ? formatToCurrency(newPositionRisk.collateralCC, orderInfo.poolName)
                    : '-'
                }
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Leverage:{' '}
                  </Typography>
                }
                rightSide={
                  isOrderValid && newPositionRisk && newPositionRisk.positionNotionalBaseCCY !== 0
                    ? `${formatNumber(newPositionRisk?.leverage)}x`
                    : '-'
                }
              />
              <SidesRow
                leftSide={
                  <Typography variant="bodySmall" className={styles.left}>
                    {' '}
                    Liquidation price:{' '}
                  </Typography>
                }
                rightSide={
                  !isOrderValid || !newPositionRisk || newPositionRisk.liquidationPrice[0] <= 0
                    ? '-'
                    : formatToCurrency(newPositionRisk?.liquidationPrice[0] ?? 0, orderInfo.quoteCurrency)
                }
              />
            </Box>
          </DialogContent>
          <Box className={styles.emphasis}>
            <SidesRow
              leftSide={
                <Typography variant="bodyMedium" className={styles.semibold}>
                  Validity checks
                </Typography>
              }
              rightSide={
                <Typography
                  variant="bodyMedium"
                  className={styles.bold}
                  style={{ color: validityCheckText === 'Good to go' ? 'green' : 'red' }}
                >
                  {validityCheckText === 'Good to go' ? 'Passed' : validityCheckText === '-' ? '-' : 'Failed'}
                </Typography>
              }
            />
          </Box>
          <DialogContent>
            <Box className={styles.goMessage}>
              <Typography
                variant="bodySmall"
                className={styles.centered}
                style={{ color: validityCheckText === 'Good to go' ? 'green' : 'red' }}
              >
                {validityCheckText}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeReviewOrderModal} variant="secondary" size="small">
              Cancel
            </Button>
            <Button onClick={handleOrderConfirm} variant="primary" size="small" disabled={isConfirmButtonDisabled}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
});
