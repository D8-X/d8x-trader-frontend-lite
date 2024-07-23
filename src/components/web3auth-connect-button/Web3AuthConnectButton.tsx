import classnames from 'classnames';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { X, Google, Email } from '@mui/icons-material';
import { Button } from '@mui/material';

import { useWeb3Auth } from 'context/web3-auth-context/Web3AuthContext';
import { Web3SignInMethodE } from 'types/enums';

import styles from './Web3AuthConnectButton.module.scss';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
  signInMethod: Web3SignInMethodE;
}

export const Web3AuthConnectButton = memo(({ buttonClassName, signInMethod }: Web3AuthConnectButtonPropsI) => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();

  const { web3Auth, signInWithGoogle, signInWithTwitter, signInWithEmail, isConnecting } = useWeb3Auth();

  if (isConnected) {
    return null;
  }

  const { handleClick, icon } = (() => {
    switch (signInMethod) {
      case Web3SignInMethodE.X:
        return { handleClick: signInWithTwitter, icon: <X /> };
      case Web3SignInMethodE.Google:
        return { handleClick: signInWithGoogle, icon: <Google /> };
      case Web3SignInMethodE.Email:
        return { handleClick: signInWithEmail, icon: <Email /> };
    }
  })();

  return (
    <Button
      className={classnames(styles.connectWalletButton, buttonClassName)}
      key={'login'}
      disabled={!web3Auth || isConnecting}
      onClick={handleClick}
      variant="primary"
    >
      {icon}
      {t(`common.connect-modal.sign-in-with-${signInMethod.toLowerCase()}-button`)}
    </Button>
  );
});
