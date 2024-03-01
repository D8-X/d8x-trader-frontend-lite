import classnames from 'classnames';
import { TwitterAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAtom } from 'jotai';
import { memo, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { bytesToHex, numberToHex } from 'viem';
import { useAccount, useChainId, useConnect } from 'wagmi';

import { getPublicKey } from '@noble/secp256k1';
import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK, WALLET_ADAPTERS } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';

import { X } from '@mui/icons-material';
import { Button } from '@mui/material';

import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { web3AuthConfig } from 'config';
import { auth } from 'FireBaseConfig';
import { postSocialVerify } from 'network/referral';
import { socialPKAtom, socialUserInfoAtom, web3authIdTokenAtom } from 'store/web3-auth.store';
import { TemporaryAnyT } from 'types/types';

import styles from './Web3AuthConnectButton.module.scss';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
  successCallback?: () => void;
  errorCallback?: (error: string) => void;
}

const clientId = web3AuthConfig.web3AuthClientId;
const verifierName = web3AuthConfig.web3AuthVerifier;

export const Web3AuthConnectButton = memo((props: Web3AuthConnectButtonPropsI) => {
  const { t } = useTranslation();

  const { buttonClassName, successCallback = () => {}, errorCallback = () => {} } = props;

  const { isConnected } = useAccount();

  const [userInfo, setUserInfo] = useAtom(socialUserInfoAtom);
  const [socialPK, setSocialPK] = useAtom(socialPKAtom);
  const [web3authIdToken, setWeb3authIdToken] = useAtom(web3authIdTokenAtom);

  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);

  const requestRef = useRef(false);

  const { connectAsync } = useConnect({
    connector: new Web3AuthConnector({
      chains: chains,
      options: {
        web3AuthInstance: web3auth,
        loginParams: {
          loginProvider: 'jwt',
          extraLoginOptions: {
            id_token: web3authIdToken,
            verifierIdField: 'sub',
            // domain: '...', // example included this, but works without it?
          },
        },
      },
    }),
  });

  const chainId = useChainId();

  useEffect(() => {
    const init = async () => {
      try {
        const chain = chains[0]; // make this index a user input instead of 0?
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: numberToHex(chain.id),
          rpcTarget: chain.rpcUrls.default.http[0],
          displayName: chain.name,
          blockExplorer: chain.blockExplorers?.default.url ?? '',
          ticker: chain.nativeCurrency.symbol,
          tickerName: chain.nativeCurrency.name,
        };
        const web3authInstance = new Web3AuthNoModal({
          clientId,
          chainConfig,
          web3AuthNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
          useCoreKitKey: false,
        });
        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
        const openloginAdapter = new OpenloginAdapter({
          privateKeyProvider,
          adapterSettings: {
            uxMode: 'popup',
            loginConfig: {
              jwt: {
                verifier: verifierName,
                typeOfLogin: 'jwt',
                clientId,
              },
            },
          },
        });
        web3authInstance.configureAdapter(openloginAdapter);
        setWeb3auth(web3authInstance);

        await web3authInstance.init();
        if (web3authInstance.connected) {
          // setLoggedIn(true);
        }
        // so we can switch chains
        for (let i = 1; i < chains.length; i++) {
          await web3authInstance.addChain({
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: numberToHex(chains[i].id ?? 0),
            rpcTarget: chains[i].rpcUrls.default.http[0] ?? '',
            displayName: chains[i].name ?? '',
            blockExplorer: chains[i].blockExplorers?.default.url ?? '',
            ticker: chains[i].nativeCurrency.symbol ?? '',
            tickerName: chains[i].nativeCurrency.name ?? '',
          });
        }
      } catch (error: TemporaryAnyT) {
        console.error(error);
      }
    };

    init().then();
  }, []);

  const signInWithTwitter = async () => {
    if (!auth) {
      console.log('auth not defined');
      return;
    }

    try {
      const twitterProvider = new TwitterAuthProvider();
      const loginRes = await signInWithPopup(auth, twitterProvider);

      if (!web3auth) {
        console.log('web3auth not initialized yet');
        return;
      }
      console.log('login details', loginRes);
      const idToken = await loginRes.user.getIdToken(true);

      await web3auth
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

      const info = await web3auth.getUserInfo();
      const privateKey = await web3auth.provider?.request({
        method: 'eth_private_key',
      });
      await connectAsync();
      setUserInfo(info);
      setWeb3authIdToken(idToken);
      setSocialPK(privateKey as string);
      successCallback();
    } catch (error: TemporaryAnyT) {
      console.error(error);
      errorCallback(error.message);
    }
  };

  useEffect(() => {
    const verify = async () => {
      if (!chainId || !userInfo?.idToken || !web3auth || requestRef.current || !socialPK) {
        return;
      }
      try {
        requestRef.current = true;
        const pubKey = bytesToHex(getPublicKey(socialPK));
        await postSocialVerify(chainId, userInfo?.idToken, pubKey).catch((e) =>
          console.log('POST /social-verify error', e)
        );
      } catch (error: TemporaryAnyT) {
        console.log(error);
      } finally {
        requestRef.current = false;
      }
    };
    verify().then();
  }, [userInfo, chainId, web3auth, socialPK]);

  if (isConnected) {
    return null;
  }

  return (
    <Button
      className={classnames(styles.connectWalletButton, buttonClassName)}
      key={'login'}
      disabled={!web3auth}
      onClick={signInWithTwitter}
      variant="primary"
    >
      <X />
      {t('common.connect-modal.sign-in-with-x-button')}
    </Button>
  );
});
