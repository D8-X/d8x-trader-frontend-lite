import { toUtf8String } from '@ethersproject/strings';
import { useAtom } from 'jotai';
import { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAccount, useWalletClient } from 'wagmi';

import { Box, Button, InputAdornment, Link, OutlinedInput, Typography } from '@mui/material';

import { ReactComponent as SwitchIcon } from 'assets/icons/switchSeparator.svg';
import { approveMarginToken } from 'blockchain-api/approveMarginToken';
import { InfoBlock } from 'components/info-block/InfoBlock';
import { ResponsiveInput } from 'components/responsive-input/ResponsiveInput';
import { ToastContent } from 'components/toast-content/ToastContent';
import {
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { dCurrencyPriceAtom, triggerUserStatsUpdateAtom, sdkConnectedAtom } from 'store/vault-pools.store';
import { formatToCurrency } from 'utils/formatToCurrency';

import styles from './Action.module.scss';

export const Add = memo(() => {
  const { address } = useAccount();

  const { data: walletClient } = useWalletClient({
    onError(error) {
      console.log(error);
    },
  });

  const [proxyAddr] = useAtom(proxyAddrAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
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

    if (!liqProvTool || !isSDKConnected || !selectedPool || !addAmount || addAmount < 0 || !poolTokenDecimals) {
      return;
    }

    if (!address || !walletClient || !proxyAddr) {
      return;
    }

    requestSentRef.current = true;
    setRequestSent(true);
    await approveMarginToken(walletClient, selectedPool.marginTokenAddr, proxyAddr, addAmount, poolTokenDecimals)
      .then(async (res) => {
        if (res?.hash) {
          console.log(`token approval txn: ${res.hash}`);
          await res.wait();
        }
        liqProvTool
          .addLiquidity(walletClient, selectedPool.poolSymbol, addAmount, { gasLimit: 2_000_000 })
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
                const response = await walletClient.call(
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
    selectedPool,
    address,
    proxyAddr,
    walletClient,
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
    if (!addAmount || requestSent || !isSDKConnected || !selectedPool?.brokerCollateralLotSize || !poolTokenBalance) {
      return true;
    }
    return addAmount > poolTokenBalance || addAmount < selectedPool.brokerCollateralLotSize;
  }, [addAmount, requestSent, isSDKConnected, selectedPool, poolTokenBalance]);

  return (
    <div className={styles.root}>
      <Box className={styles.infoBlock}>
        <Typography variant="h5">Add Liquidity</Typography>
        <Typography variant="body2" className={styles.text}>
          Add liquidity to the {selectedPool?.poolSymbol} pool and receive d{selectedPool?.poolSymbol}, an ERC-20 token
          that represents your ownership in the liquidity pool.
        </Typography>
        <Typography variant="body2" className={styles.text}>
          As a liquidity provider, you'll earn trading fees and funding rate payments on all trades collateralized in{' '}
          {selectedPool?.poolSymbol}. You'll also participate in the PnL of the pool. d{selectedPool?.poolSymbol}{' '}
          accumulates fees, funding rate payments and PnL in real-time.
        </Typography>
      </Box>
      <Box className={styles.contentBlock}>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            <InfoBlock
              title={
                <>
                  Amount of <strong>{selectedPool?.poolSymbol}</strong>
                </>
              }
              content={
                <>
                  <Typography>Specify the amount of {selectedPool?.poolSymbol} you want to add to the pool.</Typography>
                </>
              }
              classname={styles.actionIcon}
            />
          </Box>
          <ResponsiveInput
            id="add-amount-size"
            className={styles.inputHolder}
            inputValue={inputValue}
            setInputValue={handleInputCapture}
            currency={selectedPool?.poolSymbol}
            step="1"
            min={0}
            max={poolTokenBalance || 999999}
          />
        </Box>
        {poolTokenBalance ? (
          <Typography className={styles.helperText} variant="bodyTiny">
            Max: <Link onClick={handleMaxAmount}>{formatToCurrency(poolTokenBalance, selectedPool?.poolSymbol)}</Link>
          </Typography>
        ) : null}
        <Box className={styles.iconSeparator}>
          <SwitchIcon />
        </Box>
        <Box className={styles.inputLine}>
          <Box className={styles.label}>
            You receive <strong>d{selectedPool?.poolSymbol}</strong>
          </Box>
          <Box className={styles.inputHolder}>
            <OutlinedInput
              id="expected-amount"
              endAdornment={
                <InputAdornment position="end">
                  <Typography variant="adornment">d{selectedPool?.poolSymbol}</Typography>
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
