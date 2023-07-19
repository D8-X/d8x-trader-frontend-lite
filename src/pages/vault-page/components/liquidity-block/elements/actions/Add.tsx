import { toUtf8String } from '@ethersproject/strings';
import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useSigner } from 'wagmi';

import { Box, Button, InputAdornment, Link, OutlinedInput, Typography } from '@mui/material';

import { ReactComponent as SwitchIcon } from 'assets/icons/switchSeparator.svg';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import {
  dCurrencyPriceAtom,
  triggerUserStatsUpdateAtom,
  sdkConnectedAtom,
  selectedLiquidityPoolAtom,
} from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';
import { poolTokenBalanceAtom, poolTokenDecimalsAtom, proxyAddrAtom, traderAPIAtom } from 'store/pools.store';

import styles from './Action.module.scss';

export const Add = memo(() => {
  const { address } = useAccount();

  const { data: signer } = useSigner({
    onError(error) {
      console.log(error);
    },
  });

  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [selectedLiquidityPool] = useAtom(selectedLiquidityPoolAtom);
  const [liqProvTool] = useAtom(traderAPIAtom);
  const [dCurrencyPrice] = useAtom(dCurrencyPriceAtom);
  const [, setTriggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);
  const [isSDKConnected] = useAtom(sdkConnectedAtom);
  const [poolTokenDecimals] = useAtom(poolTokenDecimalsAtom);
  const [poolTokenBalance] = useAtom(poolTokenBalanceAtom);

  const [addAmount, setAddAmount] = useState(0);
  const [requestSent, setRequestSent] = useState(false);

  const [inputValue, setInputValue] = useState(`${addAmount}`);

  const requestSentRef = useRef(false);
  const inputValueChangedRef = useRef(false);

  const handleInputCapture = useCallback((orderSizeValue: string) => {
    if (orderSizeValue) {
      setAddAmount(+orderSizeValue);
      setInputValue(orderSizeValue);
    } else {
      setAddAmount(0);
      setInputValue('');
    }
    inputValueChangedRef.current = true;
  }, []);

  useEffect(() => {
    if (!inputValueChangedRef.current) {
      setInputValue(`${addAmount}`);
    }
    inputValueChangedRef.current = false;
  }, [addAmount]);

  const handleAddLiquidity = useCallback(async () => {
    if (requestSentRef.current) {
      return;
    }

    if (
      !liqProvTool ||
      !isSDKConnected ||
      !selectedLiquidityPool ||
      !addAmount ||
      addAmount < 0 ||
      !poolTokenDecimals
    ) {
      return;
    }

    if (!address || !signer || !proxyAddr) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);
    await approveMarginToken(signer, selectedLiquidityPool.marginTokenAddr, proxyAddr, addAmount, poolTokenDecimals)
      .then(async (res) => {
        if (res?.hash) {
          console.log(`token approval txn: ${res.hash}`);
          await res.wait();
        }
        liqProvTool
          .addLiquidity(signer, selectedLiquidityPool.poolSymbol, addAmount, { gasLimit: 2_000_000 })
          .then(async (tx) => {
            console.log(`addLiquidity tx hash: ${tx.hash}`);
            toast.success(<ToastContent title="Adding Liquidity" bodyLines={[]} />);
            await tx
              .wait()
              .then((receipt) => {
                if (receipt.status === 1) {
                  setTriggerUserStatsUpdate((prevValue) => !prevValue);
                  setAddAmount(0);
                  setInputValue('0');
                  requestSentRef.current = false;
                  setRequestSent(false);
                  toast.success(<ToastContent title="Liquidity Added" bodyLines={[]} />);
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
                setTriggerUserStatsUpdate((prevValue) => !prevValue);
                requestSentRef.current = false;
                setRequestSent(false);
                toast.error(
                  <ToastContent title="Error Adding Liquidity" bodyLines={[{ label: 'Reason', value: reason }]} />
                );
              });
          });
      })
      .catch(async () => {
        setTriggerUserStatsUpdate((prevValue) => !prevValue);
        requestSentRef.current = false;
        setRequestSent(false);
        toast.error(<ToastContent title="Error adding liquidity" bodyLines={[]} />);
      });
  }, [
    addAmount,
    liqProvTool,
    selectedLiquidityPool,
    address,
    proxyAddr,
    signer,
    isSDKConnected,
    poolTokenDecimals,
    setTriggerUserStatsUpdate,
  ]);

  const handleMaxAmount = useCallback(() => {
    if (poolTokenBalance) {
      handleInputCapture(`${poolTokenBalance}`);
    }
  }, [handleInputCapture, poolTokenBalance]);

  const predictedAmount = useMemo(() => {
    if (addAmount > 0 && dCurrencyPrice != null) {
      return addAmount / dCurrencyPrice;
    }
    return 0;
  }, [addAmount, dCurrencyPrice]);

  const isButtonDisabled = useMemo(() => {
    if (
      !addAmount ||
      requestSent ||
      !isSDKConnected ||
      !selectedLiquidityPool?.brokerCollateralLotSize ||
      !poolTokenBalance
    ) {
      return true;
    }
    return addAmount > poolTokenBalance || addAmount < selectedLiquidityPool.brokerCollateralLotSize;
  }, [addAmount, requestSent, isSDKConnected, selectedLiquidityPool, poolTokenBalance]);

  return (
    <div className={styles.root}>
      <Box className={styles.infoBlock}>
        <Typography variant="h5">Add Liquidity</Typography>
        <Typography variant="body2" className={styles.text}>
          Add liquidity to the {selectedLiquidityPool?.poolSymbol} pool and receive d{selectedLiquidityPool?.poolSymbol}
          , an ERC-20 token that represents your ownership in the liquidity pool.
        </Typography>
        <Typography variant="body2" className={styles.text}>
          As a liquidity provider, you'll earn trading fees and funding rate payments on all trades collateralized in{' '}
          {selectedLiquidityPool?.poolSymbol}. You'll also participate in the PnL of the pool. d
          {selectedLiquidityPool?.poolSymbol} accumulates fees, funding rate payments and PnL in real-time.
        </Typography>
      </Box>
      <Box className={styles.contentBlock}>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            <InfoBlock
              title={
                <>
                  Amount of <strong>{selectedLiquidityPool?.poolSymbol}</strong>
                </>
              }
              content={
                <>
                  <Typography>
                    Specify the amount of {selectedLiquidityPool?.poolSymbol} you want to add to the pool.
                  </Typography>
                </>
              }
            />
          </Box>
          <ResponsiveInput
            id="add-amount-size"
            className={styles.inputHolder}
            inputValue={inputValue}
            setInputValue={handleInputCapture}
            currency={selectedLiquidityPool?.poolSymbol}
            step="1"
            min={0}
            max={poolTokenBalance || 999999}
          />
        </Box>
        {poolTokenBalance && (
          <Typography className={styles.helperText} variant="bodyTiny">
            Max:{' '}
            <Link onClick={handleMaxAmount}>
              {formatToCurrency(poolTokenBalance, selectedLiquidityPool?.poolSymbol)}
            </Link>
          </Typography>
        )}
        <Box className={styles.iconSeparator}>
          <SwitchIcon />
        </Box>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            You receive <strong>d{selectedLiquidityPool?.poolSymbol}</strong>
          </Box>
          <Box className={styles.inputHolder}>
            <OutlinedInput
              id="expected-amount"
              endAdornment={
                <InputAdornment position="end">
                  <Typography variant="adornment">d{selectedLiquidityPool?.poolSymbol}</Typography>
                </InputAdornment>
              }
              type="text"
              value={formatToCurrency(predictedAmount, '')}
              disabled
            />
          </Box>
        </Box>
        <Box className={styles.buttonHolder}>
          <Button
            variant="primary"
            disabled={isButtonDisabled}
            onClick={handleAddLiquidity}
            className={styles.actionButton}
          >
            Add
          </Button>
        </Box>
      </Box>
    </div>
  );
});
