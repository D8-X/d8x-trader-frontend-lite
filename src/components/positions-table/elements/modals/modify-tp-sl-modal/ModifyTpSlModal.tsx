import classnames from 'classnames';
import { useAtom, useSetAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { type Address, erc20Abi } from 'viem';
import { useAccount, useChainId, useReadContracts, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';

import { HashZero, SECONDARY_DEADLINE_MULTIPLIER } from 'appConstants';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { postOrder } from 'blockchain-api/contract-interactions/postOrder';
import { Dialog } from 'components/dialog/Dialog';
import { GasDepositChecker } from 'components/gas-deposit-checker/GasDepositChecker';
import { Separator } from 'components/separator/Separator';
import { ToastContent } from 'components/toast-content/ToastContent';
import { getTxnLink } from 'helpers/getTxnLink';
import { parseSymbol } from 'helpers/parseSymbol';
import { orderDigest, positionRiskOnTrade } from 'network/network';
import { tradingClientAtom } from 'store/app.store';
import { latestOrderSentTimestampAtom } from 'store/order-block.store';
import { poolFeeAtom, poolsAtom, proxyAddrAtom, traderAPIAtom } from 'store/pools.store';
import { OpenOrderTypeE, OrderSideE, OrderTypeE } from 'types/enums';
import { MarginAccountWithAdditionalDataI, OrderI, OrderWithIdI, PoolWithIdI } from 'types/types';
import { formatToCurrency } from 'utils/formatToCurrency';

import { cancelOrders } from '../../../helpers/cancelOrders';
import { StopLossSelector } from './components/StopLossSelector';
import { TakeProfitSelector } from './components/TakeProfitSelector';

import styles from '../Modal.module.scss';

interface ModifyModalPropsI {
  isOpen: boolean;
  selectedPosition?: MarginAccountWithAdditionalDataI | null;
  closeModal: () => void;
}

function createMainOrder(position: MarginAccountWithAdditionalDataI) {
  const deadlineMultiplier = 200; // By default, is it set to 200 hours

  return {
    symbol: position.symbol,
    side: position.side,
    type: OrderTypeE.Market,
    // limitPrice: undefined,
    // stopPrice: undefined,
    quantity: position.positionNotionalBaseCCY,
    leverage: position.leverage,
    reduceOnly: true,
    // keepPositionLvg: undefined,
    executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
    deadline: Math.floor(Date.now() / 1000 + 60 * 60 * deadlineMultiplier),
  };
}

export const ModifyTpSlModal = memo(({ isOpen, selectedPosition, closeModal }: ModifyModalPropsI) => {
  const { t } = useTranslation();

  const { address, chain, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient({
    chainId,
  });

  const [pools] = useAtom(poolsAtom);
  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [tradingClient] = useAtom(tradingClientAtom);
  const [poolFee] = useAtom(poolFeeAtom);
  const setLatestOrderSentTimestamp = useSetAtom(latestOrderSentTimestampAtom);

  const [collateralDeposit, setCollateralDeposit] = useState<number | null>(null);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | null | undefined>(undefined);
  const [stopLossPrice, setStopLossPrice] = useState<number | null | undefined>(undefined);
  const [requestSent, setRequestSent] = useState(false);
  const [txHash, setTxHash] = useState<Address | undefined>(undefined);
  const [selectedPool, setSelectedPool] = useState<PoolWithIdI>();

  const validityCheckRef = useRef(false);
  const requestSentRef = useRef(false);

  useEffect(() => {
    if (validityCheckRef.current) {
      return;
    }

    if (!selectedPosition || !address || !traderAPI || !poolFee) {
      return;
    }

    validityCheckRef.current = true;

    const mainOrder = createMainOrder(selectedPosition);
    positionRiskOnTrade(chainId, traderAPI, mainOrder, address, selectedPosition, poolFee)
      .then((data) => {
        setCollateralDeposit(data.data.orderCost);
      })
      .catch(console.error)
      .finally(() => {
        validityCheckRef.current = false;
      });
  }, [selectedPosition, address, traderAPI, chainId, poolFee]);

  useEffect(() => {
    if (selectedPosition && pools.length > 0) {
      const parsedSymbol = parseSymbol(selectedPosition.symbol);
      const foundPool = pools.find(({ poolSymbol }) => poolSymbol === parsedSymbol?.poolSymbol);
      setSelectedPool(foundPool);
    } else {
      setSelectedPool(undefined);
    }
  }, [selectedPosition, pools]);

  const { data: poolTokenBalance } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: selectedPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: selectedPool?.marginTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: { enabled: address && chainId === chain?.id && !!selectedPool?.marginTokenAddr && isConnected },
  });

  const { isSuccess, isError, isFetched } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!address && !!selectedPosition?.symbol && !!txHash },
  });

  useEffect(() => {
    if (!isFetched) {
      return;
    }
    setTxHash(undefined);
  }, [isFetched, setLatestOrderSentTimestamp]);

  useEffect(() => {
    if (!isError) {
      return;
    }
    toast.error(<ToastContent title={t('pages.trade.action-block.toasts.error.title')} bodyLines={[]} />);
  }, [isError, t]);

  useEffect(() => {
    if (!isSuccess || !txHash) {
      return;
    }
    setLatestOrderSentTimestamp(Date.now());
    toast.success(
      <ToastContent
        title={t('pages.trade.action-block.toasts.order-submitted.title')}
        bodyLines={[
          {
            label: t('pages.trade.action-block.toasts.order-submitted.body'),
            value: selectedPosition?.symbol,
          },
          {
            label: '',
            value: (
              <a
                href={getTxnLink(chain?.blockExplorers?.default?.url, txHash)}
                target="_blank"
                rel="noreferrer"
                className={styles.shareLink}
              >
                {txHash}
              </a>
            ),
          },
        ]}
      />
    );
  }, [isSuccess, txHash, chain, selectedPosition?.symbol, setLatestOrderSentTimestamp, t]);

  if (!selectedPosition) {
    return null;
  }

  const parsedSymbol = parseSymbol(selectedPosition.symbol);

  const handleModifyPositionConfirm = async () => {
    if (
      !selectedPool ||
      !selectedPosition ||
      requestSentRef.current ||
      !tradingClient ||
      !address ||
      !proxyAddr ||
      !walletClient ||
      collateralDeposit === null ||
      !poolTokenBalance ||
      !poolTokenBalance[1]
    ) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);

    const ordersToCancel: OrderWithIdI[] = [];
    if (takeProfitPrice !== selectedPosition.takeProfit.fullValue && selectedPosition.takeProfit.orders.length > 0) {
      ordersToCancel.push(...selectedPosition.takeProfit.orders);
    }
    if (stopLossPrice !== selectedPosition.stopLoss.fullValue && selectedPosition.stopLoss.orders.length > 0) {
      ordersToCancel.push(...selectedPosition.stopLoss.orders);
    }

    await cancelOrders({
      ordersToCancel,
      chainId,
      chain,
      traderAPI,
      tradingClient,
      toastTitle: t('pages.trade.orders-table.toasts.cancel-order.title'),
      nonceShift: 0,
      callback: () => {
        setLatestOrderSentTimestamp(Date.now());
      },
    });

    const parsedOrders: OrderI[] = [];
    if (takeProfitPrice != null && takeProfitPrice !== selectedPosition.takeProfit.fullValue) {
      parsedOrders.push({
        // Changed values comparing to main Order
        side: selectedPosition.side === OrderSideE.Buy ? OrderSideE.Sell : OrderSideE.Buy,
        type: OpenOrderTypeE.Limit,
        limitPrice: takeProfitPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: selectedPosition.symbol,
        quantity: selectedPosition.positionNotionalBaseCCY,
        leverage: selectedPosition.leverage,
        reduceOnly: true,
        // keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      });
    }

    if (stopLossPrice != null && stopLossPrice !== selectedPosition.stopLoss.fullValue) {
      parsedOrders.push({
        // Changed values comparing to main Order
        side: selectedPosition.side === OrderSideE.Buy ? OrderSideE.Sell : OrderSideE.Buy,
        type: OpenOrderTypeE.StopMarket,
        stopPrice: stopLossPrice,
        deadline: Math.floor(Date.now() / 1000 + 60 * 60 * SECONDARY_DEADLINE_MULTIPLIER),

        // Same as for main Order
        symbol: selectedPosition.symbol,
        quantity: selectedPosition.positionNotionalBaseCCY,
        leverage: selectedPosition.leverage,
        reduceOnly: true,
        // keepPositionLvg: orderInfo.keepPositionLeverage,
        executionTimestamp: Math.floor(Date.now() / 1000 - 10 - 200),
      });
    }

    if (parsedOrders.length > 0) {
      orderDigest(chainId, parsedOrders, address)
        .then((data) => {
          if (data.data.digests.length > 0) {
            // hide modal now that metamask popup shows up
            approveMarginToken(
              walletClient,
              selectedPool.marginTokenAddr,
              proxyAddr,
              collateralDeposit,
              poolTokenBalance[1]
            )
              .then(() => {
                // trader doesn't need to sign if sending his own orders: signatures are dummy zero hashes
                const signatures = new Array<string>(data.data.digests.length).fill(HashZero);
                postOrder(tradingClient, signatures, data.data, false)
                  .then((tx) => {
                    // success submitting order to the node
                    // order was sent
                    setTakeProfitPrice(null);
                    setStopLossPrice(null);
                    toast.success(
                      <ToastContent
                        title={t('pages.trade.action-block.toasts.processed.title')}
                        bodyLines={[{ label: 'Symbol', value: parsedOrders[0].symbol }]}
                      />
                    );
                    setTxHash(tx.hash);
                    setLatestOrderSentTimestamp(Date.now());
                  })
                  .finally(() => {
                    // ensure we can trade again - but modal is left open if user rejects txn
                    requestSentRef.current = false;
                    setRequestSent(false);
                  });
              })
              .catch((error) => {
                // not a transaction error, but probably metamask or network -> no toast
                console.error(error);
              });
          }
        })
        .catch((error) => {
          // not a transaction error, but probably metamask or network -> no toast
          console.error(error);
        });
    }

    requestSentRef.current = false;
    setRequestSent(false);
    closeModal();
  };

  const isDisabledCreateButton =
    !selectedPool ||
    requestSent ||
    collateralDeposit === null ||
    (takeProfitPrice === selectedPosition.takeProfit.fullValue &&
      stopLossPrice === selectedPosition.stopLoss.fullValue);

  return (
    <Dialog open={isOpen} className={classnames(styles.root, styles.wide)}>
      <DialogTitle>{t('pages.trade.positions-table.modify-modal.tp-sl-title')}</DialogTitle>
      <DialogContent className={styles.contentWithGap}>
        {t('pages.trade.positions-table.modify-modal.tp-sl-position', {
          positionSize: formatToCurrency(selectedPosition.positionNotionalBaseCCY, parsedSymbol?.baseCurrency, true),
        })}
      </DialogContent>
      <Separator />
      <DialogContent className={styles.selectors}>
        <TakeProfitSelector setTakeProfitPrice={setTakeProfitPrice} position={selectedPosition} />
        <StopLossSelector setStopLossPrice={setStopLossPrice} position={selectedPosition} />
      </DialogContent>
      <Separator />
      <DialogActions>
        <Button onClick={closeModal} variant="secondary" size="small">
          {t('pages.trade.positions-table.modify-modal.cancel')}
        </Button>
        <GasDepositChecker multiplier={2n}>
          <Button
            onClick={handleModifyPositionConfirm}
            variant="primary"
            size="small"
            disabled={isDisabledCreateButton}
          >
            {t('pages.trade.positions-table.modify-modal.create')}
          </Button>
        </GasDepositChecker>
      </DialogActions>
    </Dialog>
  );
});
