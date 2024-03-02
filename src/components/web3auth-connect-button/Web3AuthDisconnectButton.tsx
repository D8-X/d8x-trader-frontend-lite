import classnames from 'classnames';
import { useSetAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useDisconnect } from 'wagmi';

import { Button } from '@mui/material';

import { socialPKAtom, socialUserInfoAtom, web3authIdTokenAtom } from 'store/web3-auth.store';

import styles from './Web3AuthConnectButton.module.scss';
import { accountModalOpenAtom } from '../../store/global-modals.store';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
}

export const Web3AuthDisconnectButton = memo(({ buttonClassName }: Web3AuthConnectButtonPropsI) => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const setUserInfo = useSetAtom(socialUserInfoAtom);
  const setSocialPK = useSetAtom(socialPKAtom);
  const setWeb3authIdToken = useSetAtom(web3authIdTokenAtom);
  const setAccountModalOpen = useSetAtom(accountModalOpenAtom);

  const handleDisconnect = () => {
    setUserInfo(null);
    setSocialPK(undefined);
    setWeb3authIdToken('');
    setAccountModalOpen(false);
    disconnect();
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Button
      className={classnames(styles.connectWalletButton, buttonClassName)}
      onClick={handleDisconnect}
      variant="primary"
    >
      {t('common.connect-modal.disconnect')}
    </Button>
  );
});
