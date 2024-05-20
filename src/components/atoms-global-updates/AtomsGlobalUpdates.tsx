import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';
import { type Address } from 'viem';
import { useAccount } from 'wagmi';

import { getTradingFee } from 'network/network';
import { activatedOneClickTradingAtom } from 'store/app.store';
import { storageKeyAtom } from 'store/order-block.store';
import { addr0FeeAtom, poolFeeAtom, selectedPoolAtom } from 'store/pools.store';
import { isEnabledChain } from '../../utils/isEnabledChain';

export const AtomsGlobalUpdates = () => {
  const { address, chainId, isDisconnected } = useAccount();

  const selectedPool = useAtomValue(selectedPoolAtom);
  const setActivatedOneClickTrading = useSetAtom(activatedOneClickTradingAtom);
  const setStorageKey = useSetAtom(storageKeyAtom);
  const setPoolFee = useSetAtom(poolFeeAtom);
  const setAddr0Fee = useSetAtom(addr0FeeAtom);

  const fetchFeeRef = useRef(false);
  const fetchAddr0FeeRef = useRef(false);

  const fetchFee = useCallback(
    async (_chainId: number, _poolSymbol: string, _address: Address) => {
      if (fetchFeeRef.current) {
        return;
      }
      fetchFeeRef.current = true;
      try {
        const { data } = await getTradingFee(_chainId, _poolSymbol, _address);
        setPoolFee(data);
      } catch (err) {
        console.error(err);
      } finally {
        fetchFeeRef.current = false;
      }
    },
    [setPoolFee]
  );

  const fetchAddr0Fee = useCallback(
    async (_chainId: number, _poolSymbol: string) => {
      if (fetchAddr0FeeRef.current) {
        return;
      }
      fetchAddr0FeeRef.current = true;
      try {
        const { data } = await getTradingFee(_chainId, _poolSymbol, '0x0000000000000000000000000000000000000000');
        setAddr0Fee(data);
      } catch (err) {
        console.error(err);
      } finally {
        fetchAddr0FeeRef.current = false;
      }
    },
    [setAddr0Fee]
  );

  useEffect(() => {
    if (isDisconnected) {
      setActivatedOneClickTrading(false);
      setStorageKey(null);
    }
  }, [isDisconnected, setActivatedOneClickTrading, setStorageKey]);

  useEffect(() => {
    if (!chainId || !isEnabledChain(chainId) || !selectedPool?.poolSymbol || !address) {
      setPoolFee(undefined);
      setAddr0Fee(undefined);
      return;
    }
    fetchFee(chainId, selectedPool.poolSymbol, address).then();
    fetchAddr0Fee(chainId, selectedPool.poolSymbol).then();
  }, [chainId, selectedPool?.poolSymbol, address, fetchFee, fetchAddr0Fee, setPoolFee, setAddr0Fee]);

  return null;
};
