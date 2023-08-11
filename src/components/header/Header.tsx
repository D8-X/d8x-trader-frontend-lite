import { useAtom } from 'jotai';
import type { PropsWithChildren } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useAccount, useBalance, useChainId, useNetwork } from 'wagmi';

import MenuIcon from '@mui/icons-material/Menu';
import { Box, Button, Divider, Drawer, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';

import { createSymbol } from 'helpers/createSymbol';
import { pages } from 'navigation/pages';
import { getExchangeInfo } from 'network/network';
import { triggerUserStatsUpdateAtom } from 'store/vault-pools.store';
import {
  oracleFactoryAddrAtom,
  poolTokenBalanceAtom,
  poolsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  perpetualsAtom,
  selectedPoolIdAtom,
  traderAPIAtom,
  poolTokenDecimalsAtom,
} from 'store/pools.store';
import type { AddressT, ExchangeInfoI, PerpetualDataI } from 'types/types';

import { Container } from '../container/Container';
import { InteractiveLogo } from '../interactive-logo/InteractiveLogo';
import { LanguageSwitcher } from '../language-switcher/LanguageSwitcher';
import { WalletConnectButton } from '../wallet-connect-button/WalletConnectButton';

import { PageAppBar } from './Header.styles';
import styles from './Header.module.scss';

interface HeaderPropsI extends PropsWithChildren {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
}

const drawerWidth = 240;

export const Header = memo(({ window, children }: HeaderPropsI) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const isTabletScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { t } = useTranslation();
  const chainId = useChainId();
  const { chain } = useNetwork();
  const { address } = useAccount();

  const [pools, setPools] = useAtom(poolsAtom);
  const [, setPerpetuals] = useAtom(perpetualsAtom);
  const [, setOracleFactoryAddr] = useAtom(oracleFactoryAddrAtom);
  const [, setProxyAddr] = useAtom(proxyAddrAtom);
  const [, setPoolTokenBalance] = useAtom(poolTokenBalanceAtom);
  const [, setSelectedPoolId] = useAtom(selectedPoolIdAtom);
  const [, setPoolTokenDecimals] = useAtom(poolTokenDecimalsAtom);
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
      setPools(data.pools);
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
    [setPools, setPerpetuals, setOracleFactoryAddr, setProxyAddr]
  );

  useEffect(() => {
    let poolId = null;
    if (traderAPI && pools.length > 0) {
      try {
        poolId = traderAPI.getPoolIdFromSymbol(pools[0].poolSymbol);
      } catch (error) {
        console.log(error);
      }
    }
    setSelectedPoolId(poolId);
  }, [pools, traderAPI, setSelectedPoolId]);

  useEffect(() => {
    if (!requestRef.current && chainId) {
      requestRef.current = true;
      setExchangeInfo(null);
      getExchangeInfo(chainId, null)
        .then(({ data }) => {
          setExchangeInfo(data);
          requestRef.current = false;
        })
        .catch((err) => {
          console.error(err);
          requestRef.current = false;
        });
    }
  }, [chainId, setExchangeInfo]);

  const {
    data: poolTokenBalance,
    isError,
    refetch,
  } = useBalance({
    address: address,
    token: selectedPool?.marginTokenAddr as AddressT | undefined,
    chainId: chain?.id,
    enabled: !requestRef.current && address !== undefined && chainId === chain?.id,
  });

  useEffect(() => {
    refetch().then().catch(console.error);
  }, [refetch, triggerUserStatsUpdate]);

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
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        <InteractiveLogo />
      </Typography>
      <Divider />
      <nav className={styles.navMobileWrapper}>
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
            <LanguageSwitcher />
            <Button
              onClick={handleDrawerToggle}
              variant="primary"
              className={styles.menuButton}
              sx={{ ml: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </Button>
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
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
        </Box>
      </Box>
    </Container>
  );
});
