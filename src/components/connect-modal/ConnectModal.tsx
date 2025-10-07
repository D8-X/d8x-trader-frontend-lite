import { useAtom, useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, CircularProgress, OutlinedInput, Typography } from '@mui/material';

import { Dialog } from 'components/dialog/Dialog';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { connectModalOpenAtom } from 'store/global-modals.store';
import { poolsAtom } from 'store/pools.store';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { useFundWallet, useLogout, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { writeContract } from '@wagmi/core';
import { entryPoint06Address } from 'blockchain-api/account-abstraction';
import { pimlicoPaymaster, pimlicoRpcUrl } from 'blockchain-api/pimlico';
import { wagmiConfig } from 'blockchain-api/wagmi/wagmiClient';
import { CopyLink } from 'components/copy-link/CopyLink';
import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';
import { Separator } from 'components/separator/Separator';
import { SeparatorTypeE } from 'components/separator/enums';
import { createSmartAccountClient } from 'permissionless';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { toast } from 'react-toastify';
import { smartAccountClientAtom } from 'store/app.store';
import { berachain } from 'utils/chains';
import { cutAddress } from 'utils/cutAddress';
import { valueToFractionDigits } from 'utils/formatToCurrency';
import { Chain, Client, erc20Abi, HttpTransport, zeroAddress } from 'viem';
import { SmartAccount } from 'viem/account-abstraction';
import { formatUnits, parseEther, parseUnits } from 'viem/utils';
import { http, useAccount, usePublicClient, useReadContracts, useSendTransaction, useWalletClient } from 'wagmi';
import styles from './ConnectModal.module.scss';

interface TokenRowPropsI {
  symbol: string;
  balance: string;
  tokenAddress: string;
  onDeposit: (tokenAddress: string, symbol: string) => void;
  onWithdraw: (tokenAddress: string, symbol: string) => void;
}

const TokenRow = ({ symbol, balance, tokenAddress, onDeposit, onWithdraw }: TokenRowPropsI) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--d8x-block-border-color)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DynamicLogo logoName={symbol.toLowerCase()} width={32} height={32} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="bodySmall" style={{ fontWeight: 500, marginBottom: 2 }}>
            {symbol}
          </Typography>
          <Typography variant="bodySmall" style={{ color: 'var(--d8x-color-text-secondary)' }}>
            {balance}
          </Typography>
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <Button
          variant="primary"
          size="small"
          onClick={() => onDeposit(tokenAddress, symbol)}
          className={styles.depositButton}
        >
          Deposit
        </Button>
        <Button
          variant="secondary"
          size="small"
          onClick={() => onWithdraw(tokenAddress, symbol)}
          style={{ width: '70px', height: '32px', fontSize: '12px' }}
        >
          Withdraw
        </Button>
      </div>
    </div>
  );
};

export const ConnectModal = () => {
  const { t } = useTranslation();

  const [smartAccountClient, setSmartAccountClient] = useAtom(smartAccountClientAtom);

  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isOpen, setOpen] = useAtom(connectModalOpenAtom);
  const pools = useAtomValue(poolsAtom);

  const onClose = useCallback(() => setOpen(false), [setOpen]);

  const { ready, authenticated, isModalOpen, user } = usePrivy();
  const { refetchWallet, gasTokenBalance } = useUserWallet();
  const { fundWallet } = useFundWallet();

  // Withdraw modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<{ symbol: string; tokenAddress: string } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const { sendTransaction } = useSendTransaction();

  const { logout } = useLogout({
    onSuccess: () => {
      setOpen(false);
    },
  });

  const { setActiveWallet } = useSetActiveWallet();

  const { wallets } = useWallets();

  const embeddedWallet = useMemo(() => wallets.find((w) => w.walletClientType === 'privy'), [wallets]);

  const setWalletRef = useRef(false);

  useEffect(() => {
    if (embeddedWallet && !setWalletRef.current) {
      setWalletRef.current = true;
      setActiveWallet(embeddedWallet)
        .catch(() => {})
        .finally(() => {
          setWalletRef.current = false;
        });
    }
  }, [embeddedWallet, setActiveWallet]);

  useEffect(() => {
    const initSmartAccount = async () => {
      if (!isConnected || !walletClient || !publicClient) {
        return;
      }

      try {
        if ([42161, 747474].includes(walletClient.chain.id)) {
          const safeSmartAccountClient = await toSimpleSmartAccount({
            client: publicClient,
            owner: walletClient,
            entryPoint: {
              address: entryPoint06Address,
              version: '0.6',
            },
          });

          const c = createSmartAccountClient<HttpTransport, Chain, SmartAccount, Client>({
            account: safeSmartAccountClient,
            chain: berachain,
            bundlerTransport: http(pimlicoRpcUrl),
            paymaster: pimlicoPaymaster,
            userOperation: {
              estimateFeesPerGas: async () => (await pimlicoPaymaster.getUserOperationGasPrice()).fast,
            },
          });

          setSmartAccountClient(c);
        } else {
          setSmartAccountClient(walletClient);
        }
      } catch (error) {
        console.error('Failed to initialize smart account:', error);
      }
    };

    initSmartAccount();
  }, [isConnected, walletClient, publicClient, setSmartAccountClient]);

  // Refetch balances periodically like WalletBalances does
  useEffect(() => {
    if (!ready || !authenticated) {
      return;
    }

    const intervalId = setInterval(() => {
      refetchWallet();
    }, 20000); // 20 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [refetchWallet, ready, authenticated]);

  const activeAddress = user?.wallet?.address || smartAccountClient?.account?.address || '';

  // Get pools data like WalletBalances does
  const activePools = useMemo(() => pools.filter((pool) => pool.isRunning), [pools]);
  const unroundedGasValue = gasTokenBalance ? +formatUnits(gasTokenBalance.value, gasTokenBalance.decimals) : 1;
  const numberDigits = valueToFractionDigits(unroundedGasValue);

  // Fetch balances for all pool tokens
  const poolTokenAddresses = useMemo(
    () => activePools.map((pool) => pool.settleTokenAddr as `0x${string}`),
    [activePools]
  );

  const { data: poolTokenBalances } = useReadContracts({
    allowFailure: true,
    contracts: poolTokenAddresses.flatMap((tokenAddress) => [
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [activeAddress as `0x${string}`],
      },
      {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      },
    ]),
  });

  // Create final token list with real balances
  const tokensWithBalances = useMemo(() => {
    const tokens = [];

    // Add gas token (BERA)
    tokens.push({
      symbol: gasTokenBalance?.symbol || 'BERA',
      balance: gasTokenBalance
        ? (+formatUnits(gasTokenBalance.value, gasTokenBalance.decimals)).toFixed(numberDigits)
        : '0.0000',
      tokenAddress: zeroAddress,
    });

    // Add pool tokens with real balances
    activePools.forEach((pool, index) => {
      const balanceIndex = index * 2;
      const decimalsIndex = balanceIndex + 1;

      let balance = '0.0000';
      if (poolTokenBalances?.[balanceIndex]?.result && poolTokenBalances?.[decimalsIndex]?.result) {
        const tokenBalance = poolTokenBalances[balanceIndex].result as bigint;
        const decimals = poolTokenBalances[decimalsIndex].result as number;
        balance = (+formatUnits(tokenBalance, decimals)).toFixed(4);
      }

      tokens.push({
        symbol: pool.settleSymbol,
        balance,
        tokenAddress: pool.settleTokenAddr,
      });
    });

    return tokens;
  }, [gasTokenBalance, activePools, numberDigits, poolTokenBalances]);

  // Generic deposit handler
  const handleDepositToken = useCallback(
    (tokenAddress: string, symbol: string) => {
      if (!activeAddress) return;

      if (tokenAddress === zeroAddress) {
        // Handle gas token (BERA)
        fundWallet({
          address: activeAddress,
          options: {
            chain: berachain,
            amount: '0.1', // Default amount for BERA
          },
        })
          .then(() => {
            // Refetch balances after successful deposit
            refetchWallet();
          })
          .catch((error) => {
            console.error('Error funding BERA:', error);
          });
      } else {
        // Handle ERC20 tokens
        fundWallet({
          address: activeAddress,
          options: {
            chain: berachain,
            asset: { erc20: tokenAddress as `0x${string}` },
            amount: symbol === 'USDT' ? '100' : '10', // Default amounts
          },
        })
          .then(() => {
            // Refetch balances after successful deposit
            refetchWallet();
          })
          .catch((error) => {
            console.error(`Error funding ${symbol}:`, error);
          });
      }
    },
    [fundWallet, activeAddress, refetchWallet]
  );

  // Generic withdraw handler - opens withdraw modal
  const handleWithdrawToken = useCallback((tokenAddress: string, symbol: string) => {
    setSelectedToken({ symbol, tokenAddress });
    setWithdrawModalOpen(true);
  }, []);

  // Get token decimals for proper parsing
  const { data: tokenDecimals } = useReadContracts({
    allowFailure: true,
    contracts:
      selectedToken && selectedToken.tokenAddress !== zeroAddress
        ? [
            {
              address: selectedToken.tokenAddress as `0x${string}`,
              abi: erc20Abi,
              functionName: 'decimals',
            },
          ]
        : [],
  });

  // Handle withdraw transaction
  const handleWithdrawTransaction = useCallback(async () => {
    if (!selectedToken || !withdrawAmount || !withdrawAddress || !walletClient) return;

    setWithdrawLoading(true);
    try {
      if (selectedToken.tokenAddress === zeroAddress) {
        // Handle gas token (BERA) withdrawal
        await sendTransaction({
          to: withdrawAddress as `0x${string}`,
          value: parseEther(withdrawAmount),
        });
      } else {
        // Handle ERC20 token withdrawal using writeContract
        const decimals = (tokenDecimals?.[0]?.result as number) || 18;
        await writeContract(wagmiConfig, {
          account: walletClient.account,
          abi: erc20Abi,
          address: selectedToken.tokenAddress as `0x${string}`,
          functionName: 'transfer',
          args: [withdrawAddress as `0x${string}`, parseUnits(withdrawAmount, decimals)],
        });
      }

      // Show success toast
      toast.success('Withdrawal successful');

      // Refetch balances after successful withdrawal
      refetchWallet();

      // Reset form
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawModalOpen(false);
      setSelectedToken(null);
    } catch (error) {
      console.error('Withdraw error:', error);
      toast.error('Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  }, [selectedToken, withdrawAmount, withdrawAddress, walletClient, sendTransaction, tokenDecimals, refetchWallet]);

  return (
    <>
      <Dialog
        open={isOpen && !isModalOpen}
        onClose={onClose}
        onCloseClick={onClose}
        className={styles.dialog}
        dialogTitle={
          !authenticated ? (
            t('common.connect-modal.title')
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AccountBalanceWalletOutlinedIcon fontSize="small" />
              <CopyLink
                elementToShow={cutAddress(activeAddress)}
                textToCopy={activeAddress}
                classname={styles.copyText}
              />
            </div>
          )
        }
      >
        {ready && authenticated && (
          <div
            className={styles.actionButtonsContainer}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', gap: 12 }}
          >
            {/* Box with Deposit / Withdraw and Cash in Perpetual Account */}
            <div
              className={styles.card}
              style={{
                width: '100%',
                padding: 16,
                border: '1px solid var(--d8x-block-border-color)',
                borderRadius: 8,
                backgroundColor: 'var(--d8x-color-background-secondary)',
              }}
            >
              {/* Cash in Perpetual Account */}
              <div style={{ marginBottom: 16 }}>
                <Typography
                  variant="bodyMedium"
                  style={{
                    marginBottom: 12,
                    fontWeight: 500,
                    color: 'var(--d8x-color-text-main)',
                  }}
                >
                  Cash in Perpetual Account:
                </Typography>
                <div className={styles.tokenList}>
                  {tokensWithBalances.map((token) => (
                    <TokenRow
                      key={token.symbol}
                      symbol={token.symbol}
                      balance={token.balance}
                      tokenAddress={token.tokenAddress}
                      onDeposit={handleDepositToken}
                      onWithdraw={handleWithdrawToken}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* View on explorer */}
            {activeAddress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LanguageIcon fontSize="small" />
                <a
                  href={`${berachain.blockExplorers.default.url}/address/${activeAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Typography variant="bodySmall">
                    {t('common.connect-modal.view-on-explorer') || 'View on explorer'}
                  </Typography>
                </a>
              </div>
            )}

            <Separator separatorType={SeparatorTypeE.Modal} />

            {/* Disconnect */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PowerSettingsNewIcon fontSize="small" />
              <Button variant="text" onClick={logout}>
                {t('common.connect-modal.disconnect')}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        onCloseClick={() => setWithdrawModalOpen(false)}
        className={styles.dialog}
        dialogTitle={`Withdraw ${selectedToken?.symbol || ''}`}
        footerActions={
          <>
            <Button onClick={() => setWithdrawModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawTransaction}
              variant="primary"
              disabled={!withdrawAmount || !withdrawAddress || withdrawLoading}
            >
              {withdrawLoading && <CircularProgress size="24px" sx={{ mr: 2 }} />}
              Withdraw
            </Button>
          </>
        }
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="bodyMedium" style={{ minWidth: '120px' }}>
              Amount
            </Typography>
            <OutlinedInput
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              inputProps={{ min: 0 }}
              style={{ width: '200px' }}
            />
          </div>

          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="bodyMedium" style={{ minWidth: '120px' }}>
              Recipient Address
            </Typography>
            <OutlinedInput
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              placeholder="0x..."
              style={{ width: '200px' }}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
};
