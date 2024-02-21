import { ConnectButton } from '@rainbow-me/rainbowkit';
import classnames from 'classnames';
import { useAtom } from 'jotai';
import { memo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useChainId } from 'wagmi';

import { Box, Button, useMediaQuery, useTheme } from '@mui/material';

import { ReactComponent as WalletIcon } from 'assets/icons/walletIcon.svg';
import { ReactComponent as EmptyStar } from 'assets/starEmpty.svg';
import { ReactComponent as FilledStar } from 'assets/starFilled.svg';
import { config } from 'config';
import { getTraderLoyalty } from 'network/network';
import { loyaltyScoreAtom } from 'store/pools.store';
import { cutAddressName } from 'utils/cutAddressName';

import { LiFiWidgetButton } from './LiFiWidgetButton';
import { OneClickTradingButton } from './OneClickTradingButton';

import styles from './WalletConnectButton.module.scss';

const loyaltyMap = ['Diamond', 'Platinum', 'Gold', 'Silver', '-'];

interface WalletConnectButtonPropsI {
  buttonClassName?: string;
}

export const WalletConnectButton = memo(({ buttonClassName }: WalletConnectButtonPropsI) => {
  const { t } = useTranslation();

  const theme = useTheme();
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [loyaltyScore, setLoyaltyScore] = useAtom(loyaltyScoreAtom);

  const loadingTraderLoyaltyRef = useRef(false);

  const chainId = useChainId();
  const { address } = useAccount();

  useEffect(() => {
    if (loadingTraderLoyaltyRef.current) {
      return;
    }

    if (address) {
      loadingTraderLoyaltyRef.current = true;
      getTraderLoyalty(chainId, address)
        .then((data) => {
          setLoyaltyScore(data.data);
        })
        .catch(console.error)
        .finally(() => {
          loadingTraderLoyaltyRef.current = false;
        });
    } else {
      setLoyaltyScore(5);
    }
  }, [chainId, address, setLoyaltyScore]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              className: styles.root,
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button
                    onClick={openConnectModal}
                    variant="primary"
                    className={classnames(styles.connectWalletButton, buttonClassName)}
                  >
                    {<span className={styles.cutAddressName}>{t('common.wallet-connect')}</span>}
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button onClick={openChainModal} variant="warning">
                    {t('error.wrong-network')}
                  </Button>
                );
              }

              return (
                <div className={styles.buttonsHolder}>
                  <OneClickTradingButton />
                  {config.activateLiFi && <LiFiWidgetButton />}
                  <Button onClick={openChainModal} className={styles.chainButton} variant="primary">
                    <img src={chain.iconUrl} alt={chain.name} title={chain.name} />
                  </Button>
                  <Button onClick={openAccountModal} variant="primary" className={styles.addressButton}>
                    {!isMobileScreen && (
                      <Box className={styles.starsHolder} title={loyaltyMap[loyaltyScore - 1]}>
                        {loyaltyScore < 5 ? (
                          <FilledStar width={12} height={12} />
                        ) : (
                          <EmptyStar width={12} height={12} />
                        )}
                        {loyaltyScore < 4 ? (
                          <FilledStar width={12} height={12} />
                        ) : (
                          <EmptyStar width={12} height={12} />
                        )}
                        {loyaltyScore < 3 ? (
                          <FilledStar width={12} height={12} />
                        ) : (
                          <EmptyStar width={12} height={12} />
                        )}
                        {loyaltyScore < 2 ? (
                          <FilledStar width={12} height={12} />
                        ) : (
                          <EmptyStar width={12} height={12} />
                        )}
                      </Box>
                    )}
                    {!isMobileScreen && (
                      <span className={styles.cutAddressName}>{cutAddressName(account.address)}</span>
                    )}
                    {isMobileScreen && <WalletIcon className={styles.icon} />}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
});
