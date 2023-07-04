import { useAtom } from 'jotai';
import type { PropsWithChildren } from 'react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAccount, useBalance, useChainId, useNetwork } from 'wagmi';

import MenuIcon from '@mui/icons-material/Menu';
import { Box, Button, Divider, Drawer, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';

import { createSymbol } from 'helpers/createSymbol';
import { pages } from 'navigation/pages';
import { getExchangeInfo } from 'network/network';
import { liquidityPoolsAtom } from 'store/vault-pools.store';
import {
  oracleFactoryAddrAtom,
  poolTokenBalanceAtom,
  poolsAtom,
  proxyAddrAtom,
  selectedPoolAtom,
  perpetualsAtom,
  traderAPIAtom,
  chainIdAtom,
} from 'store/pools.store';
import { ExchangeInfoI, PerpetualDataI } from 'types/types';

import { Container } from '../container/Container';
import { InteractiveLogo } from '../interactive-logo/InteractiveLogo';
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

  const chainId = useChainId();
  const { chain } = useNetwork();
  const { address } = useAccount();

  const [, setPools] = useAtom(poolsAtom);
  const [, setLiquidityPools] = useAtom(liquidityPoolsAtom);
  const [, setPerpetuals] = useAtom(perpetualsAtom);
  const [, setOracleFactoryAddr] = useAtom(oracleFactoryAddrAtom);
  const [, setProxyAddr] = useAtom(proxyAddrAtom);
  const [, setPoolTokenBalance] = useAtom(poolTokenBalanceAtom);
  const [selectedPool] = useAtom(selectedPoolAtom);
  const [traderAPI] = useAtom(traderAPIAtom);
  const [, setChainId] = useAtom(chainIdAtom);

  const [mobileOpen, setMobileOpen] = useState(false);

  // const chainId = useMemo(() => {
  //   if (chain) {
  //     console.log(`switched chain id: ${chain.id}`);
  //     return chain.id;
  //   }
  // }, [chain]);
  const requestRef = useRef(false);
  const chainIdRef = useRef(chainId);

  const setExchangeInfo = useCallback(
    (data: ExchangeInfoI | null) => {
      if (!data) {
        setProxyAddr(undefined);
        return;
      }
      setPools(data.pools);
      setLiquidityPools(data.pools);
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
    [setPools, setLiquidityPools, setPerpetuals, setOracleFactoryAddr, setProxyAddr]
  );

  useEffect(() => {
    if (!requestRef.current && chainId) {
      requestRef.current = true;
      setExchangeInfo(null);
      getExchangeInfo(chainId, null)
        .then(({ data }) => {
          setExchangeInfo(data);
          setChainId(chainId);
          requestRef.current = false;
        })
        .catch((err) => {
          console.log(err);
          // API call failed - try with SDK
          if (traderAPI && chainId === chainIdRef.current) {
            getExchangeInfo(chainId, traderAPI).then(({ data }) => {
              setExchangeInfo(data);
              setChainId(chainId);
            });
          }
          requestRef.current = false;
        });
    }
  }, [chainId, traderAPI, setExchangeInfo, setChainId]); //setPools, setPerpetuals, setOracleFactoryAddr, setProxyAddr]);

  const { data: poolTokenBalance, isError } = useBalance({
    address: address,
    token: selectedPool?.marginTokenAddr as `0x${string}` | undefined,
    chainId: chain?.id,
    enabled: !requestRef.current && address !== undefined && chainId === chain?.id,
  });

  useEffect(() => {
    if (poolTokenBalance && selectedPool && chain && !isError) {
      setPoolTokenBalance(Number(poolTokenBalance.formatted));
    }
  }, [selectedPool, chain, poolTokenBalance, isError, setPoolTokenBalance]);

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
            {page.title}
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
              {!isSmallScreen && (
                <nav className={styles.navWrapper}>
                  {pages.map((page) => (
                    <NavLink
                      key={page.id}
                      to={page.path}
                      className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : styles.inactive}`}
                    >
                      {page.title}
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
            <Button
              onClick={handleDrawerToggle}
              variant="primary"
              className={styles.menuButton}
              sx={{ ml: 2, display: { sm: 'none' } }}
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
              display: { xs: 'block', sm: 'none' },
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
