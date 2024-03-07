import classnames from 'classnames';
import { TwitterAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAtom } from 'jotai';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { numberToHex } from 'viem';
import { useAccount, useChainId, useConnect } from 'wagmi';

// import { getPublicKey } from '@noble/secp256k1';
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
// import { postSocialVerify } from 'network/referral';
import { socialPKAtom, socialUserInfoAtom, web3authIdTokenAtom, web3authProviderAtom } from 'store/web3-auth.store';
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

  const [, setUserInfo] = useAtom(socialUserInfoAtom);
  const [, setSocialPK] = useAtom(socialPKAtom);
  const [web3authIdToken, setWeb3authIdToken] = useAtom(web3authIdTokenAtom);
  const [, setWeb3authProvider] = useAtom(web3authProviderAtom);

  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);

  const { connectAsync } = useConnect({
    connector: new Web3AuthConnector({
      chains,
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
    const chain = chains.find(({ id }) => id === chainId);
    if (!chain) {
      return;
    }

    console.log({ contractAddress: chain.contracts?.multicall3?.address });

    const init = async () => {
      try {
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
        if (web3authInstance.provider) {
          setWeb3authProvider(web3authInstance.provider);
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
  }, [chainId, setWeb3authProvider]);

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
