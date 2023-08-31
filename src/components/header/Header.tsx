import { useAtom, useSetAtom } from 'jotai';
import type { PropsWithChildren } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useAccount, useBalance, useChainId, useNetwork, type Address } from 'wagmi';

import MenuIcon from '@mui/icons-material/Menu';
import { Box, Button, Divider, Drawer, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';

import { createSymbol } from 'helpers/createSymbol';
import { getExchangeInfo } from 'network/network';
import { pages } from 'routes/pages';
import {
  oracleFactoryAddrAtom,
  perpetualsAtom,
  poolsAtom,
  poolTokenBalanceAtom,
  poolTokenDecimalsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  traderAPIAtom,
} from 'store/pools.store';
import { triggerUserStatsUpdateAtom } from 'store/vault-pools.store';
import type { ExchangeInfoI, PerpetualDataI } from 'types/types';

import { Container } from '../container/Container';
import { InteractiveLogo } from '../interactive-logo/InteractiveLogo';
import { LanguageSwitcher } from '../language-switcher/LanguageSwitcher';
import { WalletConnectButton } from '../wallet-connect-button/WalletConnectButton';
import { SettingsBlock } from './elements/settings-block/SettingsBlock';
import { SettingsButton } from './elements/settings-button/SettingsButton';

import styles from './Header.module.scss';
import { PageAppBar } from './Header.styles';
import { collateralsAtom } from './elements/market-select/collaterals.store';

interface HeaderPropsI extends PropsWithChildren {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
}

const DRAWER_WIDTH_FOR_TABLETS = 300;

export const Header = memo(({ window, children }: HeaderPropsI) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const isTabletScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { t } = useTranslation();

  const chainId = useChainId();
  const { chain } = useNetwork();
  const { address } = useAccount();

  const setPools = useSetAtom(poolsAtom);
  const setCollaterals = useSetAtom(collateralsAtom);
  const setPerpetuals = useSetAtom(perpetualsAtom);
  const setOracleFactoryAddr = useSetAtom(oracleFactoryAddrAtom);
  const setProxyAddr = useSetAtom(proxyAddrAtom);
  const setPoolTokenBalance = useSetAtom(poolTokenBalanceAtom);
  const setPoolTokenDecimals = useSetAtom(poolTokenDecimalsAtom);
  const [triggerUserStatsUpdate] = useAtom(triggerUserStatsUpdateAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [traderAPI] = useAtom(traderAPIAtom);

  const [mobileOpen, setMobileOpen] = useState(false);
  const requestRef = useRef(false);

  const setExchangeInfo = useCallback(
    (data: ExchangeInfoI | null) => {
      if (!data) {
        setProxyAddr(undefined);
        return;
      }
      const pools = data.pools.map((pool) => {
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
    if (!requestRef.current && chainId) {
      requestRef.current = true;
      setExchangeInfo(null);
      getExchangeInfo(chainId, traderAPI)
        .then(({ data }) => {
          setExchangeInfo(data);
          requestRef.current = false;
        })
        .catch((err) => {
          console.error(err);
          requestRef.current = false;
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
    enabled: !requestRef.current && address && chainId === chain?.id && !!selectedPool?.marginTokenAddr,
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Typography variant="h6" sx={{ my: 2, textAlign: 'center' }} onClick={handleDrawerToggle}>
        <InteractiveLogo />
      </Typography>
      <Divider />
      <nav className={styles.navMobileWrapper} onClick={handleDrawerToggle}>
        {pages.map((page) => (
          <NavLink
            key={page.id}
            to={page.path}
            className={({ isActive }) => `${styles.navMobileItem} ${isActive ? styles.active : styles.inactive}`}
          >
            {t(page.translationKey)}
          </NavLink>
        ))}
      </nav>
      <Divider />
      <Box className={styles.settings}>
        <SettingsBlock />
      </Box>
      <Divider />
      <Box className={styles.languageSwitcher}>
        <LanguageSwitcher />
      </Box>
      <Box className={styles.closeAction}>
        <Button onClick={handleDrawerToggle} variant="secondary" size="small">
          {t('common.info-modal.close')}
        </Button>
      </Box>
    </Box>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Container className={styles.root}>
      <Box sx={{ display: 'flex' }}>
        <PageAppBar position="static">
          <Toolbar className={styles.toolbar}>
            <Box className={styles.leftSide}>
              <Typography variant="h6" component="div">
                <a href="/" className={styles.logoLink}>
                  <InteractiveLogo />
                </a>
              </Typography>
              {!isTabletScreen && (
                <nav className={styles.navWrapper}>
                  {pages.map((page) => (
                    <NavLink
                      key={page.id}
                      to={page.path}
                      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : styles.inactive}`}
                    >
                      {t(page.translationKey)}
                    </NavLink>
                  ))}
                </nav>
              )}
            </Box>
            {!isSmallScreen && (
              <Typography variant="h6" component="div" className={styles.selectBoxes}>
                {children}
              </Typography>
            )}
            <Typography variant="h6" component="div" className={styles.walletConnect}>
              <WalletConnectButton />
            </Typography>
            {!isTabletScreen && <SettingsButton />}
            {isTabletScreen && (
              <Button onClick={handleDrawerToggle} variant="primary" className={styles.menuButton}>
                <MenuIcon />
              </Button>
            )}
          </Toolbar>
          {isSmallScreen && <Box className={styles.mobileSelectBoxes}>{children}</Box>}
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
              display: { sm: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: isMobileScreen ? '100%' : DRAWER_WIDTH_FOR_TABLETS,
              },
            }}
          >
            {drawer}
          </Drawer>
        </Box>
      </Box>
    </Container>
  );
});
