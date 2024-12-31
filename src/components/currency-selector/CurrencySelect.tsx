import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Address } from 'viem';

import { DropDownMenuItem } from 'components/dropdown-select/components/DropDownMenuItem';
import { DropDownSelect } from 'components/dropdown-select/DropDownSelect';
import { SidesRow } from 'components/sides-row/SidesRow';
import { modalSelectedCurrencyAtom } from 'store/global-modals.store';
import { gasTokenSymbolAtom, poolsAtom, proxyAddrAtom, flatTokenAtom } from 'store/pools.store';

import { CurrencyItemI } from './types';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { MethodE } from 'types/enums';
import { fetchFlatTokenInfo } from 'blockchain-api/contract-interactions/fetchFlatTokenInfo';
import { useAccount, usePublicClient } from 'wagmi';

export const CurrencySelect = () => {
  const { t } = useTranslation();

  const { hasEnoughGasForFee } = useUserWallet();
  const publicClient = usePublicClient();
  const { address } = useAccount();

  const [selectedCurrency, setSelectedCurrency] = useAtom(modalSelectedCurrencyAtom);
  const pools = useAtomValue(poolsAtom);
  const gasTokenSymbol = useAtomValue(gasTokenSymbolAtom);
  const proxyAddr = useAtomValue(proxyAddrAtom);
  const setFlatToken = useSetAtom(flatTokenAtom);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const isFetching = useRef(false);

  const currencyItems = useMemo(() => {
    const currencies: CurrencyItemI[] = [];

    if (gasTokenSymbol) {
      currencies.push({
        id: gasTokenSymbol,
        name: gasTokenSymbol,
        settleToken: gasTokenSymbol,
        isGasToken: true,
        isActiveToken: true,
      });
    }

    if (pools.length) {
      const activePools = pools.filter((pool) => pool.isRunning);
      activePools.forEach((pool) =>
        currencies.push({
          id: `${pool.poolId}`,
          name: pool.poolSymbol,
          settleToken: pool.settleSymbol,
          isGasToken: false,
          isActiveToken: true,
          contractAddress: pool.settleTokenAddr as Address,
        })
      );

      const inactivePools = pools.filter((pool) => !pool.isRunning);
      inactivePools.forEach((pool) =>
        currencies.push({
          id: `${pool.poolId}`,
          name: pool.poolSymbol,
          settleToken: pool.settleSymbol,
          isGasToken: false,
          isActiveToken: false,
          contractAddress: pool.settleTokenAddr as Address,
        })
      );
    }

    return currencies;
  }, [gasTokenSymbol, pools]);

  useEffect(() => {
    if (currencyItems.length > 1 && hasEnoughGasForFee(MethodE.Interact, 1n)) {
      setSelectedCurrency(currencyItems[1]);
    } else if (currencyItems.length > 0) {
      setSelectedCurrency(currencyItems[0]);
    }
  }, [currencyItems, hasEnoughGasForFee, setSelectedCurrency]);

  useEffect(() => {
    if (selectedCurrency?.contractAddress && proxyAddr && publicClient && address && !isFetching.current) {
      isFetching.current = true;
      console.log('fetching ....');
      fetchFlatTokenInfo(publicClient, proxyAddr as Address, selectedCurrency?.contractAddress as Address, address)
        .then((info) => {
          console.log(info);
          setFlatToken(info);
        })
        .catch((e) => console.error(e))
        .finally(() => {
          isFetching.current = false;
        });
    }
  }, [address, proxyAddr, publicClient, selectedCurrency?.contractAddress, setFlatToken]);

  return (
    <SidesRow
      leftSide={t('common.currency-label')}
      rightSide={
        <DropDownSelect
          id="currency-dropdown"
          selectedValue={selectedCurrency?.settleToken}
          anchorEl={anchorEl}
          setAnchorEl={setAnchorEl}
          fullWidth
        >
          {currencyItems.map((item) => (
            <DropDownMenuItem
              key={item.id}
              option={item.settleToken}
              isActive={item.id === selectedCurrency?.id}
              onClick={() => {
                setSelectedCurrency(item);
                setAnchorEl(null);
              }}
            />
          ))}
        </DropDownSelect>
      }
    />
  );
};
