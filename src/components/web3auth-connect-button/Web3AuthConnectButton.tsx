import classnames from 'classnames';
import { TwitterAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount, useConnect } from 'wagmi';

import { WALLET_ADAPTERS } from '@web3auth/base';
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';

import { X } from '@mui/icons-material';
import { Button } from '@mui/material';

import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { auth } from 'FireBaseConfig';
import { socialPKAtom, socialUserInfoAtom, web3authAtom, web3authIdTokenAtom } from 'store/web3-auth.store';
import { TemporaryAnyT } from 'types/types';

import styles from './Web3AuthConnectButton.module.scss';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
  successCallback?: () => void;
  errorCallback?: (error: string) => void;
}

export const Web3AuthConnectButton = memo((props: Web3AuthConnectButtonPropsI) => {
  const { t } = useTranslation();

  const { buttonClassName, successCallback = () => {}, errorCallback = () => {} } = props;

  const { isConnected } = useAccount();

  const setUserInfo = useSetAtom(socialUserInfoAtom);
  const setSocialPK = useSetAtom(socialPKAtom);
  const web3Auth = useAtomValue(web3authAtom);
  const [web3AuthIdToken, setWeb3AuthIdToken] = useAtom(web3authIdTokenAtom);

  const { connectAsync } = useConnect({
    connector: new Web3AuthConnector({
      chains,
      options: {
        web3AuthInstance: web3Auth,
        loginParams: {
          loginProvider: 'jwt',
          extraLoginOptions: {
            id_token: web3AuthIdToken,
            verifierIdField: 'sub',
            // domain: '...', // example included this, but works without it?
          },
        },
      },
    }),
  });

  const signInRef = useRef(false);

  const signInWithTwitter = async () => {
    if (!auth || signInRef.current) {
      console.log('auth not defined');
      return;
    }
    signInRef.current = true;
    try {
      const twitterProvider = new TwitterAuthProvider();
      console.log('signInWithPopup', web3Auth?.status, web3Auth?.connected);
      const loginRes = await signInWithPopup(auth, twitterProvider);

      if (!web3Auth) {
        console.log('web3Auth not initialized yet');
        return;
      }
      console.log('login details', loginRes);
      console.log('getIdToken', web3Auth.status, web3Auth.connected);
      const idToken = await loginRes.user.getIdToken(true);

      console.log('connectTo(WALLET_ADAPTERS.OPENLOGIN,', web3Auth?.status, web3Auth?.connected);
      await web3Auth
        .connectTo(WALLET_ADAPTERS.OPENLOGIN, {
          loginProvider: 'jwt',
          extraLoginOptions: {
            id_token: idToken,
            verifierIdField: 'sub',
            // domain: '...', // example included this, but works without it?
          },
        })
        .catch((error: TemporaryAnyT) => {
          console.log(error);
          errorCallback(error.message);
        });
      console.log('info & pk', web3Auth.status, web3Auth.connected);
      const info = await web3Auth.getUserInfo();
      const privateKey = await web3Auth.provider?.request({
        method: 'eth_private_key',
      });
      console.log('connectAsync', web3Auth.status, web3Auth.connected);
      await connectAsync();
      setUserInfo(info);
      setWeb3AuthIdToken(idToken);
      setSocialPK(privateKey as string);
      console.log('successCallback', web3Auth.status, web3Auth.connected);
      successCallback();
    } catch (error: TemporaryAnyT) {
      console.error(error);
      errorCallback(error.message);
    } finally {
      signInRef.current = false;
    }
  };

  if (isConnected) {
    return null;
  }

  return (
    <Button
      className={classnames(styles.connectWalletButton, buttonClassName)}
      key={'login'}
      disabled={!web3Auth}
      onClick={signInWithTwitter}
      variant="primary"
    >
      <X />
      {t('common.connect-modal.sign-in-with-x-button')}
    </Button>
  );
});
