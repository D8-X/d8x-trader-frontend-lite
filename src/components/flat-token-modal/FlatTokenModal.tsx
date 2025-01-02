import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';

import { Button, Typography } from '@mui/material';
import { Dialog } from 'components/dialog/Dialog';
import { SeparatorTypeE } from 'components/separator/enums';
import { Separator } from 'components/separator/Separator';
import { depositModalOpenAtom, flatTokentModalOpenAtom } from 'store/global-modals.store';

import { isEnabledChain } from 'utils/isEnabledChain';

import styles from './FlatTokenModal.module.scss';
import { FlatTokenSelect } from './elements/flat-token-selector/FlatTokenSelect';
import { flatTokenAtom, proxyAddrAtom, selectedPoolAtom, selectedStableAtom } from 'store/pools.store';
import { Address } from 'viem';
import { fetchFlatTokenInfo } from 'blockchain-api/contract-interactions/fetchFlatTokenInfo';
import { registerFlatToken } from 'blockchain-api/contract-interactions/registerFlatToken';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { toast } from 'react-toastify';
import { ToastContent } from 'components/toast-content/ToastContent';

export const FlatTokenModal = () => {
  const { address, chainId } = useAccount();
  const { isMultisigAddress } = useUserWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [flatTokentModalOpen, setFlatTokentModalOpen] = useAtom(flatTokentModalOpenAtom);
  const [flatToken, setFlatToken] = useAtom(flatTokenAtom);
  const setDepositModalOpen = useSetAtom(depositModalOpenAtom);
  const [selectedStable, setSelectedStable] = useAtom(selectedStableAtom);
  const proxyAddr = useAtomValue(proxyAddrAtom);
  const selectedPool = useAtomValue(selectedPoolAtom);

  const [title] = useState('');
  const [txHash, setTxHash] = useState<Address | undefined>();

  const isBusyRef = useRef(false);

  const handleOnClose = useCallback(() => {
    setFlatTokentModalOpen(false);
  }, [setFlatTokentModalOpen]);

  const isRegisterEnabled =
    walletClient && flatToken?.isFlatToken && address && selectedPool && selectedStable && !txHash;

  const handleRegisterToken = () => {
    if (walletClient && flatToken?.isFlatToken && address && selectedPool && selectedStable && !isBusyRef.current) {
      isBusyRef.current = true;
      registerFlatToken({
        walletClient: walletClient,
        flatTokenAddr: selectedPool.settleTokenAddr as Address,
        userTokenAddr: selectedStable,
        isMultisigAddress: isMultisigAddress,
        confirm: false,
      })
        .then(({ hash }) => {
          setTxHash(hash);
        })
        .catch((e) => {
          toast.error(
            <ToastContent
              title={`Something went wrong`}
              bodyLines={[
                {
                  label: 'Error',
                  value: e,
                },
              ]}
            />
          );
        })
        .finally(() => {
          isBusyRef.current = false;
        });
    }
  };

  const { isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success(
        <ToastContent
          title={`Success`}
          bodyLines={[
            {
              label: 'Token',
              value: selectedStable,
            },
          ]}
        />
      );
      setTxHash(undefined);
      setFlatTokentModalOpen(false);
    }
  }, [isSuccess, selectedStable, setFlatTokentModalOpen]);

  useEffect(() => {
    if (isError) {
      toast.error(
        <ToastContent
          title={`Error`}
          bodyLines={[
            {
              label: 'Txn',
              value: txHash,
            },
          ]}
        />
      );
      setTxHash(undefined);
    }
  }, [isError, txHash]);

  useEffect(() => {
    if (!isBusyRef.current) {
      setFlatToken(undefined);
      setSelectedStable(undefined);
      if (selectedPool?.settleTokenAddr && proxyAddr && publicClient && address) {
        isBusyRef.current = true;
        fetchFlatTokenInfo(publicClient, proxyAddr as Address, selectedPool.settleTokenAddr as Address, address)
          .then((info) => {
            setFlatToken(info);
            if (info.isFlatToken && !info.registeredToken) {
              setDepositModalOpen(false);
              setFlatTokentModalOpen(true);
            }
          })
          .catch()
          .finally(() => {
            isBusyRef.current = false;
          });
      }
    }
  }, [
    address,
    proxyAddr,
    publicClient,
    selectedPool,
    setFlatToken,
    setDepositModalOpen,
    setFlatTokentModalOpen,
    setSelectedStable,
  ]);

  if (!isEnabledChain(chainId)) {
    return null;
  }

  return (
    <Dialog
      open={flatTokentModalOpen}
      onClose={handleOnClose}
      onCloseClick={handleOnClose}
      className={styles.dialog}
      dialogTitle={title}
    >
      <div className={styles.section}>
        <Typography variant="bodyMedium" className={styles.noteText}>
          This pool accepts multiple stablecoins as collateral. Please select your preferred token.
        </Typography>
      </div>

      <Separator separatorType={SeparatorTypeE.Modal} />

      <div className={styles.section}>
        <FlatTokenSelect />
      </div>

      <Separator separatorType={SeparatorTypeE.Modal} />

      <div className={styles.section}>
        <Typography variant="bodyMedium" className={styles.noteText}>
          IMPORTANT: This choice cannot be undone.
        </Typography>
      </div>

      <div className={styles.row}>
        <Button variant="primary" onClick={handleRegisterToken} disabled={!isRegisterEnabled}>
          Save
        </Button>
      </div>
    </Dialog>
  );
};
