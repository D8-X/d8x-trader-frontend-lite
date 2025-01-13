import { useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

import { Dialog } from 'components/dialog/Dialog';
import { marketSelectModalOpenAtom } from 'store/global-modals.store';
import { clearInputsDataAtom } from 'store/order-block.store';
import { selectedPerpetualAtom, selectedPoolAtom } from 'store/pools.store';
import { getEnabledChainId } from 'utils/getEnabledChainId';

import { OptionsHeader } from './elements/options-header/OptionsHeader';
import { MarketOption } from './elements/market-option/MarketOption';
import { useMarkets } from './hooks/useMarkets';
import { PerpetualWithPoolAndMarketI } from './types';
import { useMarketsFilter } from './useMarketsFilter';

import styles from './MarketSelectModal.module.scss';

export const MarketSelectModal = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();

  const { chainId } = useAccount();
  const [selectedPerpetual, setSelectedPerpetual] = useAtom(selectedPerpetualAtom);
  const [isMarketSelectModalOpen, setMarketSelectModalOpen] = useAtom(marketSelectModalOpenAtom);
  const setSelectedPool = useSetAtom(selectedPoolAtom);
  const clearInputsData = useSetAtom(clearInputsDataAtom);

  const markets = useMarkets();
  const filteredMarkets = useMarketsFilter(markets);

  const handleClose = useCallback(() => {
    setMarketSelectModalOpen(false);
  }, [setMarketSelectModalOpen]);

  const handleChange = (newItem: PerpetualWithPoolAndMarketI) => {
    setSelectedPool(newItem.poolSymbol);
    setSelectedPerpetual(newItem.id);

    const hash = `${newItem.baseCurrency}-${newItem.quoteCurrency}-${newItem.poolSymbol}`;
    const chainIdForThisURL = getEnabledChainId(chainId, location.hash);

    navigate(`${location.pathname}${location.search}#${hash}__chainId=${chainIdForThisURL}`);
    clearInputsData();
    setMarketSelectModalOpen(false);
  };

  return (
    <Dialog
      open={isMarketSelectModalOpen}
      className={styles.dialog}
      onClose={handleClose}
      onCloseClick={handleClose}
      scroll="paper"
      dialogTitle={t('common.select.market.header')}
    >
      <OptionsHeader />
      <div className={styles.optionList}>
        {filteredMarkets.map((market) => (
          <MarketOption
            key={market.value}
            option={market}
            isSelected={market.item.id === selectedPerpetual?.id}
            onClick={() => handleChange(market.item)}
          />
        ))}
      </div>
    </Dialog>
  );
};
