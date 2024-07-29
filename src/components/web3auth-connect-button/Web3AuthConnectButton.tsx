import classnames from 'classnames';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';

import { X, Google, Email } from '@mui/icons-material';
import { Button } from '@mui/material';

import { useWeb3Auth } from 'context/web3-auth-context/Web3AuthContext';
import { Web3SignInMethodE } from 'types/enums';

import styles from './Web3AuthConnectButton.module.scss';
import { useAtom } from 'jotai';
import { web3AuthUserEmailAtom } from 'store/web3-auth.store';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
  signInMethod: Web3SignInMethodE;
}

export const Web3AuthConnectButton = memo(({ buttonClassName, signInMethod }: Web3AuthConnectButtonPropsI) => {
  const { t } = useTranslation();

  const { isConnected } = useAccount();

  const {
    web3Auth,
    signInWithGoogle,
    signInWithTwitter,
    signInWithEmailAccount,
    signInWithEmailPasswordless,
    sendEmailSignInLink,
    createEmailAccount,
    isConnecting,
  } = useWeb3Auth();

  const [userEmail, setUserEmail] = useAtom(web3AuthUserEmailAtom);

  const { handleClick, icon, title } = useMemo(() => {
    if (signInMethod === Web3SignInMethodE.EmailLink) {
      return {
        handleClick: () => {
          if (userEmail !== '') {
            const emailLink = window.prompt(`Please enter the link sent to ${userEmail}:`);
            if (emailLink) {
              signInWithEmailPasswordless(userEmail, emailLink);
              // setUserEmail('');
            }
          } else {
            const email = window.prompt('Please enter your e-mail address:');
            if (email) {
              sendEmailSignInLink(email);
              setUserEmail(email);
            }
          }
        },
        icon: <Email />,
        title: userEmail === '' ? 'Sign In with Email Link' : 'Enter Sign In Link',
      };
    } else if (signInMethod === Web3SignInMethodE.EmailAccount) {
      return {
        handleClick: () => {
          if (userEmail !== '') {
            const pwd = window.prompt(`Please enter your password:`);
            if (pwd) {
              signInWithEmailAccount(userEmail, pwd);
              // setUserEmail('');
            }
          } else {
            const email = window.prompt('Please enter your e-mail address:');
            const pwd = window.prompt('Create your password:');
            if (email && pwd) {
              createEmailAccount(email, pwd);
              setUserEmail(email);
            }
          }
        },
        icon: <Email />,
        title: userEmail === '' ? 'Sign Up with Email' : 'Sign In with Email & Password',
      };
    } else {
      const buttonTitle = t(`common.connect-modal.sign-in-with-${signInMethod.toLowerCase()}-button`);
      return signInMethod === Web3SignInMethodE.X
        ? { handleClick: signInWithTwitter, icon: <X />, title: buttonTitle }
        : { handleClick: signInWithGoogle, icon: <Google />, title: buttonTitle };
    }
  }, [
    signInMethod,
    signInWithTwitter,
    signInWithGoogle,
    signInWithEmailPasswordless,
    signInWithEmailAccount,
    sendEmailSignInLink,
    createEmailAccount,
    setUserEmail,
    userEmail,
    t,
  ]);

  if (isConnected) {
    return null;
  }

  return (
    <Button
      className={classnames(styles.connectWalletButton, buttonClassName)}
      key={'login'}
      disabled={!web3Auth || isConnecting}
      onClick={handleClick}
      variant="primary"
    >
      {icon}
      {title}
    </Button>
  );
});
