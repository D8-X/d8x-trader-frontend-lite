import classnames from 'classnames';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { type Address, useAccount, useBalance, useChainId, useNetwork } from 'wagmi';

import { Close, Menu } from '@mui/icons-material';
import { Box, Button, Divider, Drawer, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';

import LogoWithText from 'assets/logoWithText.svg?react';
import { Container } from 'components/container/Container';
import { DepositModal } from 'components/deposit-modal/DepositModal';
import { LanguageSwitcher } from 'components/language-switcher/LanguageSwitcher';
import { Separator } from 'components/separator/Separator';
import { WalletConnectButton } from 'components/wallet-connect-button/WalletConnectButton';
import { WalletConnectedButtons } from 'components/wallet-connect-button/WalletConnectedButtons';
import { web3AuthConfig } from 'config';
import { createSymbol } from 'helpers/createSymbol';
import { getExchangeInfo, getPositionRisk } from 'network/network';
import { authPages, pages } from 'routes/pages';
import { hideBetaTextAtom } from 'store/app.store';
import {
  gasTokenSymbolAtom,
  oracleFactoryAddrAtom,
  perpetualsAtom,
  poolsAtom,
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  positionsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  traderAPIAtom,
  triggerPositionsUpdateAtom,
} from 'store/pools.store';
import { triggerUserStatsUpdateAtom } from 'store/vault-pools.store';
import type { ExchangeInfoI, PerpetualDataI } from 'types/types';

import { ConnectModal } from './elements/connect-modal/ConnectModal';
import { collateralsAtom } from './elements/market-select/collaterals.store';
import { SettingsBlock } from './elements/settings-block/SettingsBlock';
import { SettingsButton } from './elements/settings-button/SettingsButton';

import styles from './Header.module.scss';
import { PageAppBar } from './Header.styles';

interface HeaderPropsI {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
}

const DRAWER_WIDTH_FOR_TABLETS = 340;
const isSocialLoginEnabled = web3AuthConfig.web3AuthClientId !== '';

export const Header = memo(({ window }: HeaderPropsI) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const isTabletScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();

  const chainId = useChainId();
  const { chain } = useNetwork();
  const { address, isConnected, isReconnecting, isConnecting } = useAccount();

  const setPools = useSetAtom(poolsAtom);
  const setCollaterals = useSetAtom(collateralsAtom);
  const setPerpetuals = useSetAtom(perpetualsAtom);
  const setPositions = useSetAtom(positionsAtom);
  const setOracleFactoryAddr = useSetAtom(oracleFactoryAddrAtom);
  const setProxyAddr = useSetAtom(proxyAddrAtom);
  const setPoolTokenBalance = useSetAtom(poolTokenBalanceAtom);
  const setGasTokenSymbol = useSetAtom(gasTokenSymbolAtom);
  const setPoolTokenDecimals = useSetAtom(poolTokenDecimalsAtom);
  const triggerPositionsUpdate = useAtomValue(triggerPositionsUpdateAtom);
  const triggerUserStatsUpdate = useAtomValue(triggerUserStatsUpdateAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const traderAPI = useAtomValue(traderAPIAtom);
  const [hideBetaText, setHideBetaText] = useAtom(hideBetaTextAtom);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isConnectModalOpen, setConnectModalOpen] = useState(false);

  const exchangeRequestRef = useRef(false);
  const positionsRequestRef = useRef(false);

  const setExchangeInfo = useCallback(
    (data: ExchangeInfoI | null) => {
      if (!data) {
        setProxyAddr(undefined);
        return;
      }
      const pools = data.pools
        .filter((pool) => pool.isRunning)
        .map((pool) => {
          let poolId = 0;
          if (traderAPI) {
            try {
              poolId = traderAPI.getPoolIdFromSymbol(pool.poolSymbol);
            } catch (error) {
              console.log(error);
            }
          }

          return {
            ...pool,
            poolId,
          };
        });
      setPools(pools);
      setCollaterals(pools.map((pool) => pool.poolSymbol));
      const perpetuals: PerpetualDataI[] = [];
      data.pools.forEach((pool) => {
        perpetuals.push(
          ...pool.perpetuals.map((perpetual) => ({
            id: perpetual.id,
            poolName: pool.poolSymbol,
            baseCurrency: perpetual.baseCurrency,
            quoteCurrency: perpetual.quoteCurrency,
            symbol: createSymbol({
              poolSymbol: pool.poolSymbol,
              baseCurrency: perpetual.baseCurrency,
              quoteCurrency: perpetual.quoteCurrency,
            }),
          }))
        );
      });
      setPerpetuals(perpetuals);
      setOracleFactoryAddr(data.oracleFactoryAddr);
      setProxyAddr(data.proxyAddr);
    },
    [setPools, setCollaterals, setPerpetuals, setOracleFactoryAddr, setProxyAddr, traderAPI]
  );

  useEffect(() => {
    if (positionsRequestRef.current) {
      return;
    }

    if (chainId && (!traderAPI || traderAPI.chainId === chainId) && address) {
      positionsRequestRef.current = true;
      getPositionRisk(chainId, traderAPI, address, Date.now())
        .then(({ data }) => {
          if (data && data.length > 0) {
            data.map(setPositions);
          }
        })
        .catch(console.error)
        .finally(() => {
          positionsRequestRef.current = false;
        });
    }
  }, [triggerPositionsUpdate, setPositions, chainId, traderAPI, address]);

  useEffect(() => {
    if (!exchangeRequestRef.current && chainId && (!traderAPI || traderAPI.chainId === chainId)) {
      exchangeRequestRef.current = true;
      setExchangeInfo(null);
      getExchangeInfo(chainId, traderAPI)
        .then(({ data }) => {
          setExchangeInfo(data);
        })
        .catch(console.error)
        .finally(() => {
          exchangeRequestRef.current = false;
        });
    }
  }, [chainId, setExchangeInfo, traderAPI]);

  const {
    data: poolTokenBalance,
    isError,
    refetch,
  } = useBalance({
    address,
    token: selectedPool?.marginTokenAddr as Address,
    chainId: chain?.id,
    enabled:
      !exchangeRequestRef.current &&
      address &&
      traderAPI?.chainId === chain?.id &&
      !!selectedPool?.marginTokenAddr &&
      isConnected &&
      !isReconnecting &&
      !isConnecting,
  });

  const { data: gasTokenBalance, isError: isGasTokenFetchError } = useBalance({
    address,
    enabled: address && traderAPI?.chainId === chain?.id && isConnected && !isReconnecting && !isConnecting,
  });

  useEffect(() => {
    if (address) {
      refetch().then().catch(console.error);
    }
  }, [address, refetch, triggerUserStatsUpdate]);

  useEffect(() => {
    if (poolTokenBalance && selectedPool && chain && !isError) {
      setPoolTokenBalance(Number(poolTokenBalance.formatted));
      setPoolTokenDecimals(poolTokenBalance.decimals);
    }
  }, [selectedPool, chain, poolTokenBalance, isError, setPoolTokenBalance, setPoolTokenDecimals]);

  useEffect(() => {
    if (gasTokenBalance && !isGasTokenFetchError) {
      setGasTokenSymbol(gasTokenBalance.symbol);
    }
  }, [isGasTokenFetchError, gasTokenBalance, setGasTokenSymbol]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const availablePages = [...pages.filter((page) => page.enabled)];
  if (address) {
    availablePages.push(...authPages.filter((page) => page.enabled));
  }
  const drawer = (
    <>
      <Typography
        variant="h6"
        sx={{ my: 2, textAlign: 'center' }}
        onClick={handleDrawerToggle}
        className={styles.drawerLogoHolder}
      >
        <LogoWithText width={86} height={20} />
        <span className={styles.betaTag}>{t('common.public-beta.beta-tag')}</span>
      </Typography>
      <Divider />
      <nav className={styles.navMobileWrapper} onClick={handleDrawerToggle}>
        {availablePages.map((page) => (
          <NavLink
            key={page.id}
            to={page.path}
            className={({ isActive }) => `${styles.navMobileItem} ${isActive ? styles.active : styles.inactive}`}
          >
            {page.IconComponent && <page.IconComponent className={styles.pageIcon} />}
            {t(page.translationKey)}
          </NavLink>
        ))}
      </nav>
      {isTabletScreen && (
        <>
          <Divider />
          <Box className={styles.settings}>
            <SettingsBlock />
          </Box>
          <Box className={styles.languageSwitcher}>
            <LanguageSwitcher />
          </Box>
        </>
      )}
      <Box className={styles.closeAction}>
        <Button onClick={handleDrawerToggle} variant="secondary" size="small">
          {t('common.info-modal.close')}
        </Button>
      </Box>
    </>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <>
      <div className={classnames(styles.betaInfoLine, { [styles.hideBetaText]: hideBetaText })}>
        <div className={styles.textBlock}>{t('common.public-beta.info-text')}</div>
        <div title={t('common.info-modal.close')} className={styles.closeButton} onClick={() => setHideBetaText(true)}>
          <Close className={styles.closeIcon} />
        </div>
      </div>
      <Container className={styles.root}>
        <div className={styles.headerHolder}>
          <PageAppBar position="static">
            <Toolbar className={styles.toolbar}>
              <Box className={styles.leftSide}>
                <Typography variant="h6" component="div" className={styles.mainLogoHolder}>
                  <a href="/" className={styles.logoLink}>
                    <LogoWithText width={86} height={20} />
                  </a>
                  <span className={styles.betaTag}>{t('common.public-beta.beta-tag')}</span>
                </Typography>
                {!isSmallScreen && (
                  <nav className={styles.navWrapper}>
                    {availablePages.map((page) => (
                      <NavLink
                        key={page.id}
                        to={page.path}
                        className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : styles.inactive}`}
                      >
                        {page.IconComponent && <page.IconComponent className={styles.pageIcon} />}
                        {t(page.translationKey)}
                      </NavLink>
                    ))}
                  </nav>
                )}
              </Box>
              {!isSmallScreen && (
                <Typography id="header-side" variant="h6" component="div" className={styles.selectBoxes} />
              )}
              {(!isMobileScreen || !isConnected) && (
                <Typography variant="h6" component="div" className={styles.walletConnect}>
                  {isSocialLoginEnabled && !isConnected && (
                    <Button onClick={() => setConnectModalOpen(true)} className={styles.modalButton} variant="primary">
                      <span className={styles.modalButtonText}>{t('common.wallet-connect')}</span>
                    </Button>
                  )}
                  {(!isSocialLoginEnabled || isConnected) && (
                    <>
                      <WalletConnectButton />
                      <WalletConnectedButtons />
                    </>
                  )}
                </Typography>
              )}
              {isSocialLoginEnabled && (
                <ConnectModal isOpen={isConnectModalOpen} onClose={() => setConnectModalOpen(false)} />
              )}
              {!isTabletScreen && <SettingsButton />}
              {isSmallScreen && (
                <Button onClick={handleDrawerToggle} variant="primary" className={styles.menuButton}>
                  <Menu />
                </Button>
              )}
            </Toolbar>
            {isMobileScreen && isConnected && (
              <div className={styles.mobileButtonsBlock}>
                <Separator />
                <div className={styles.mobileWalletButtons}>
                  <WalletConnectedButtons />
                </div>
              </div>
            )}
            {isConnected && <DepositModal />}
          </PageAppBar>
          <Box component="nav">
            <Drawer
              anchor="right"
              container={container}
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
              sx={{
                display: { md: 'block', lg: 'none' },
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: isMobileScreen ? '100%' : DRAWER_WIDTH_FOR_TABLETS,
                  backgroundColor: 'var(--d8x-color-background)',
                },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
        </div>
      </Container>
    </>
  );
});
