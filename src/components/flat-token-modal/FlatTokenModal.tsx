import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';

import { Button, Typography } from '@mui/material';
import { Dialog } from 'components/dialog/Dialog';
import { SeparatorTypeE } from 'components/separator/enums';
import { Separator } from 'components/separator/Separator';
import { depositModalOpenAtom, flatTokentModalOpenAtom } from 'store/global-modals.store';

import { isEnabledChain } from 'utils/isEnabledChain';

import styles from './DepositModal.module.scss';
import { FlatTokenSelect } from './elements/flat-token-selector/FlatTokenSelect';
import { flatTokenAtom, proxyAddrAtom, selectedPoolAtom, selectedStableAtom } from 'store/pools.store';
import { Address } from 'viem';
import { fetchFlatTokenInfo } from 'blockchain-api/contract-interactions/fetchFlatTokenInfo';
import { registerFlatToken } from 'blockchain-api/contract-interactions/registerFlatToken';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';

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

  const isFetching = useRef(false);

  const handleOnClose = useCallback(() => {
    setFlatTokentModalOpen(false);
  }, [setFlatTokentModalOpen]);

  const handleRegisterToken = () => {
    if (walletClient && flatToken?.isFlatToken && address && selectedPool && selectedStable)
      registerFlatToken({
        walletClient: walletClient,
        flatTokenAddr: selectedPool?.settleTokenAddr as Address,
        userTokenAddr: selectedStable,
        isMultisigAddress: isMultisigAddress,
      })
        .then(({ hash }) => {
          // TODO: toasts
          console.log('registerToken tx:', hash);
          setFlatTokentModalOpen(false);
        })
        .catch((e) => {
          console.log(e);
        });
  };

  useEffect(() => {
    if (!isFetching.current) {
      setFlatToken(undefined);
      setSelectedStable(undefined);
      if (selectedPool?.settleTokenAddr && proxyAddr && publicClient && address) {
        isFetching.current = true;
        console.log('fetching ....', proxyAddr, selectedPool.settleTokenAddr, address);
        fetchFlatTokenInfo(publicClient, proxyAddr as Address, selectedPool.settleTokenAddr as Address, address)
          .then((info) => {
            console.log(info);
            setFlatToken(info);
            if (info.isFlatToken && !info.registeredToken) {
              setDepositModalOpen(false);
              setFlatTokentModalOpen(true);
            }
          })
          .catch()
          .finally(() => {
            isFetching.current = false;
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
        <Button variant="primary" onClick={handleRegisterToken} disabled={!selectedStable}>
          Save
        </Button>
      </div>
    </Dialog>
  );
};
