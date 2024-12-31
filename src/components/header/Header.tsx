import { TraderInterface } from '@d8x/perpetuals-sdk';
import { useAtomValue, useSetAtom } from 'jotai';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { type Address, erc20Abi, formatUnits } from 'viem';
import { useAccount, useReadContracts } from 'wagmi';
import { INVALID_PERPETUAL_STATES } from 'appConstants';

import { Menu } from '@mui/icons-material';
import { Button, Drawer, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from 'assets/icons/new/close.svg?react';
import { OneClickTradingButton } from 'components/wallet-connect-button/OneClickTradingButton';
import { OwltoButton } from 'components/wallet-connect-button/OwltoButton';
import { useBridgeShownOnPage } from 'helpers/useBridgeShownOnPage';
import { isOwltoButtonEnabled } from 'helpers/isOwltoButtonEnabled';
import { web3AuthIdTokenAtom } from 'store/web3-auth.store';

import LogoWithText from 'assets/logoWithText.svg?react';
import { Container } from 'components/container/Container';
import { DepositModal } from 'components/deposit-modal/DepositModal';
import { LanguageSwitcher } from 'components/language-switcher/LanguageSwitcher';
import { collateralsAtom } from 'components/market-select-modal/collaterals.store';
import { Separator } from 'components/separator/Separator';
import { ThemeSwitcher } from 'components/theme-switcher/ThemeSwitcher';
import { WalletConnectButtonHolder } from 'components/wallet-connect-button/WalletConnectButtonHolder';
import { WalletConnectedButtons } from 'components/wallet-connect-button/WalletConnectedButtons';
import { web3AuthConfig } from 'config';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { createSymbol } from 'helpers/createSymbol';
import { getExchangeInfo, getPositionRisk } from 'network/network';
import { authPages, pages } from 'routes/pages';
import { connectModalOpenAtom } from 'store/global-modals.store';
import {
  gasTokenSymbolAtom,
  oracleFactoryAddrAtom,
  perpetualsAtom,
  allPerpetualsAtom,
  poolsAtom,
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  positionsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  traderAPIAtom,
  triggerBalancesUpdateAtom,
  triggerPositionsUpdateAtom,
} from 'store/pools.store';
import { triggerUserStatsUpdateAtom } from 'store/vault-pools.store';
import type { ExchangeInfoI, PerpetualDataI } from 'types/types';
import { getEnabledChainId } from 'utils/getEnabledChainId';
import { isEnabledChain } from 'utils/isEnabledChain';
import { isDisabledPool } from 'utils/isDisabledPool';

import styles from './Header.module.scss';
import { PageAppBar } from './Header.styles';

interface HeaderPropsI {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
}

const INTERVAL_FOR_DATA_REFETCH = 1000;
const POOL_BALANCE_MAX_RETRIES = 120;
const DRAWER_WIDTH_FOR_TABLETS = 340;
const MAX_RETRIES = 3;

export const Header = memo(({ window }: HeaderPropsI) => {
  const theme = useTheme();
  const isUpToLargeScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const isUpToTabletScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isUpToMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();

  const { chain, chainId, address, isConnected, isReconnecting, isConnecting } = useAccount();

  const { gasTokenBalance, isGasTokenFetchError } = useUserWallet();

  const setPools = useSetAtom(poolsAtom);
  const setCollaterals = useSetAtom(collateralsAtom);
  const setPerpetuals = useSetAtom(perpetualsAtom);
  const setAllPerpetuals = useSetAtom(allPerpetualsAtom);
  const setPositions = useSetAtom(positionsAtom);
  const setOracleFactoryAddr = useSetAtom(oracleFactoryAddrAtom);
  const setProxyAddr = useSetAtom(proxyAddrAtom);
  const setPoolTokenBalance = useSetAtom(poolTokenBalanceAtom);
  const setGasTokenSymbol = useSetAtom(gasTokenSymbolAtom);
  const setPoolTokenDecimals = useSetAtom(poolTokenDecimalsAtom);
  const setConnectModalOpen = useSetAtom(connectModalOpenAtom);
  const triggerBalancesUpdate = useAtomValue(triggerBalancesUpdateAtom);
  const triggerPositionsUpdate = useAtomValue(triggerPositionsUpdateAtom);
  const triggerUserStatsUpdate = useAtomValue(triggerUserStatsUpdateAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);
  const traderAPI = useAtomValue(traderAPIAtom);

  const [mobileOpen, setMobileOpen] = useState(false);

  const exchangeRequestRef = useRef(false);
  const positionsRequestRef = useRef(false);
  const traderAPIRef = useRef(traderAPI);
  const poolTokenBalanceDefinedRef = useRef(false);
  const poolTokenBalanceRetriesCountRef = useRef(0);

  const web3authIdToken = useAtomValue(web3AuthIdTokenAtom);
  const isBridgeShownOnPage = useBridgeShownOnPage();
  const isOwltoEnabled = isOwltoButtonEnabled(chainId);
  const isSignedInSocially = web3AuthConfig.isEnabled && web3authIdToken != '';

  // fetch the settle ccy fx -> save to atom

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
              console.error(error);
            }
          }

          return {
            ...pool,
            poolId,
          };
        })
        .filter(({ poolId }) => !isDisabledPool(chainId, poolId));
      setPools(pools);

      setCollaterals(pools.map((pool) => pool.settleSymbol));

      const perpetuals: PerpetualDataI[] = [];

      data.pools.forEach((pool) => {
        // Map over the pool.perpetuals array and filter out INVALID and INITIALIZING perpetuals
        const validPerpetuals = pool.perpetuals
          .filter((perpetual) => !INVALID_PERPETUAL_STATES.includes(perpetual.state))
          .map((perpetual) => {
            const symbol = createSymbol({
              poolSymbol: pool.poolSymbol,
              baseCurrency: perpetual.baseCurrency,
              quoteCurrency: perpetual.quoteCurrency,
            });
            let isPredictionMarket = false;
            try {
              const sInfo = traderAPI?.getPerpetualStaticInfo(symbol);
              isPredictionMarket = sInfo !== undefined && TraderInterface.isPredictionMarketStatic(sInfo);
            } catch {
              // skip
            }
            return {
              id: perpetual.id,
              poolName: pool.poolSymbol,
              baseCurrency: perpetual.baseCurrency,
              quoteCurrency: perpetual.quoteCurrency,
              symbol,
              isPredictionMarket,
              state: perpetual.state,
            };
          });

        // Push the valid perpetuals into the perpetuals array
        perpetuals.push(...validPerpetuals);
      });
      const filteredPerpetuals = perpetuals.filter(
        (perpetual) => perpetual.state === 'NORMAL' || perpetual.isPredictionMarket
      );
      setPerpetuals(filteredPerpetuals);
      setAllPerpetuals(perpetuals);
      setOracleFactoryAddr(data.oracleFactoryAddr);
      setProxyAddr(data.proxyAddr);
    },
    [chainId, setPools, setCollaterals, setPerpetuals, setAllPerpetuals, setOracleFactoryAddr, setProxyAddr, traderAPI]
  );

  useEffect(() => {
    if (positionsRequestRef.current) {
      return;
    }

    if (address && isEnabledChain(chainId)) {
      positionsRequestRef.current = true;
      getPositionRisk(chainId, null, address, Date.now())
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
  }, [triggerPositionsUpdate, setPositions, chainId, address]);

  const location = useLocation();

  useEffect(() => {
    if (traderAPI && Number(traderAPI.chainId) === getEnabledChainId(chainId, location.hash)) {
      traderAPIRef.current = traderAPI;
    }
  }, [traderAPI, chainId, location]);

  useEffect(() => {
    if (exchangeRequestRef.current) {
      return;
    }

    exchangeRequestRef.current = true;

    setExchangeInfo(null);

    let retries = 0;
    const executeQuery = async () => {
      while (retries < MAX_RETRIES) {
        try {
          let currentTraderAPI = null;
          const enabledChainId = getEnabledChainId(chainId, location.hash);
          if (retries > 0 && traderAPIRef.current && Number(traderAPIRef.current?.chainId) === enabledChainId) {
            currentTraderAPI = traderAPIRef.current;
          }
          const data = await getExchangeInfo(enabledChainId, currentTraderAPI);
          setExchangeInfo(data.data);
          retries = MAX_RETRIES;
        } catch (error) {
          console.error(error);
          console.info(`ExchangeInfo attempt ${retries + 1} failed: ${error}`);
          retries++;
          if (retries === MAX_RETRIES) {
            // Throw the error if max retries reached
            throw new Error('ExchangeInfo failed after maximum retries: ' + error);
          }
        }
      }
    };

    executeQuery()
      .catch(console.error)
      .finally(() => {
        exchangeRequestRef.current = false;
      });

    return () => {
      exchangeRequestRef.current = false;
    };
  }, [chainId, setExchangeInfo, location]);

  const {
    data: poolTokenBalance,
    isError,
    isRefetching,
    refetch,
  } = useReadContracts({
    allowFailure: false,
    contracts: [
      {
        address: selectedPool?.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
      },
      {
        address: selectedPool?.settleTokenAddr as Address,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ],
    query: {
      enabled:
        !exchangeRequestRef.current &&
        address &&
        Number(traderAPI?.chainId) === chainId &&
        isEnabledChain(chainId) &&
        !!selectedPool?.settleTokenAddr &&
        isConnected &&
        !isReconnecting &&
        !isConnecting,
    },
  });

  useEffect(() => {
    if (!address || !chain) {
      return;
    }

    poolTokenBalanceDefinedRef.current = false;
    refetch().then().catch(console.error);

    const intervalId = setInterval(() => {
      if (poolTokenBalanceDefinedRef.current) {
        poolTokenBalanceRetriesCountRef.current = 0;
        clearInterval(intervalId);
        return;
      }

      if (POOL_BALANCE_MAX_RETRIES <= poolTokenBalanceRetriesCountRef.current) {
        clearInterval(intervalId);
        console.warn(`Pool token balance fetch failed after ${POOL_BALANCE_MAX_RETRIES}.`);
        poolTokenBalanceRetriesCountRef.current = 0;
        return;
      }

      refetch().then().catch(console.error);
      poolTokenBalanceRetriesCountRef.current++;
    }, INTERVAL_FOR_DATA_REFETCH);

    return () => {
      clearInterval(intervalId);
      poolTokenBalanceRetriesCountRef.current = 0;
    };
  }, [address, chain, refetch, triggerUserStatsUpdate, triggerBalancesUpdate]);

  useEffect(() => {
    if (poolTokenBalance && selectedPool && chain && !isError) {
      poolTokenBalanceDefinedRef.current = true;
      setPoolTokenBalance(+formatUnits(poolTokenBalance[0], poolTokenBalance[1]));
      setPoolTokenDecimals(poolTokenBalance[1]);
    } else {
      poolTokenBalanceDefinedRef.current = false;
      setPoolTokenBalance(undefined);
      setPoolTokenDecimals(undefined);
    }
  }, [selectedPool, chain, poolTokenBalance, isError, setPoolTokenBalance, setPoolTokenDecimals, isRefetching]);

  useEffect(() => {
    if (gasTokenBalance && !isGasTokenFetchError) {
      setGasTokenSymbol(gasTokenBalance.symbol);
    }
  }, [isGasTokenFetchError, gasTokenBalance, setGasTokenSymbol]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const availablePages = [...pages.filter((page) => page.enabled)];
  if (address && isEnabledChain(chainId)) {
    availablePages.push(
      ...authPages.filter((page) => page.enabled && (!page.enabledByChains || page.enabledByChains.includes(chainId)))
    );
  }

  const drawer = (
    <>
      <div className={styles.headerContainer}>
        <div className={styles.menuTitle}>Menu</div>
        {
          <Button variant="outlined" className={styles.closeButton} onClick={handleDrawerToggle}>
            <CloseIcon width="24px" height="24px" />
          </Button>
        }
      </div>
      <Separator />
      {isUpToTabletScreen && (
        <>
          <div className={styles.settingButtonsHolderMobile}>
            {!isSignedInSocially && <OneClickTradingButton />}
            {isOwltoEnabled && isBridgeShownOnPage && <OwltoButton />}
            <ThemeSwitcher />
            <LanguageSwitcher isMini={true} />
          </div>
        </>
      )}
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
    </>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <>
      <Container className={styles.root}>
        <div className={styles.headerHolder}>
          <PageAppBar position="static">
            <Toolbar className={styles.toolbar}>
              <div className={styles.leftSide}>
                <Typography variant="h6" component="div" className={styles.mainLogoHolder}>
                  <a href="/" className={styles.logoLink}>
                    <LogoWithText width={60} height={13.95} />
                  </a>
                </Typography>
                {!isUpToLargeScreen && (
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
              </div>
              {(!isUpToMobileScreen || !isConnected) && (
                <div className={styles.walletConnect}>
                  {web3AuthConfig.isEnabled && !isConnected && (
                    <Button onClick={() => setConnectModalOpen(true)} className={styles.modalButton} variant="primary">
                      <span className={styles.modalButtonText}>{t('common.wallet-connect')}</span>
                    </Button>
                  )}
                  {(!web3AuthConfig.isEnabled || isConnected) && (
                    <>
                      <WalletConnectButtonHolder />
                      <WalletConnectedButtons />
                    </>
                  )}
                </div>
              )}
              {!isUpToTabletScreen && (
                <div className={styles.settingButtonsHolder}>
                  <ThemeSwitcher />
                  <LanguageSwitcher isMini={true} />
                </div>
              )}
              {isUpToMobileScreen && isConnected && (
                <div className={styles.mobileButtonsBlock}>
                  <div className={styles.mobileWalletButtons}>
                    <WalletConnectButtonHolder />
                    <WalletConnectedButtons mobile={true} />
                  </div>
                </div>
              )}
              {isUpToLargeScreen && (
                <Button onClick={handleDrawerToggle} variant="primary" className={styles.menuButton}>
                  <Menu />
                </Button>
              )}
            </Toolbar>
            {isConnected && <DepositModal />}
          </PageAppBar>
          <nav>
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
                  width: isUpToMobileScreen ? '100%' : DRAWER_WIDTH_FOR_TABLETS,
                  backgroundColor: 'var(--d8x-modal-background-color)',
                },
              }}
            >
              {drawer}
            </Drawer>
          </nav>
        </div>
      </Container>
    </>
  );
});
