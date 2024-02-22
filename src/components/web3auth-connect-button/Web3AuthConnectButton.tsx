import { memo, useEffect, useState } from 'react';

import { Button } from '@mui/material';

import styles from './Web3AuthConnectButton.module.scss';

import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi';
import classnames from 'classnames';
import { useSetAtom } from 'jotai';
import { socialUserInfoAtom } from 'store/app.store';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK, WALLET_ADAPTERS } from '@web3auth/base';
import { numberToHex } from 'viem';
import { config } from 'config';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { TwitterAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from 'FireBaseConfig';
import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
}

const clientId = config.web3AuthClientId;

export const Web3AuthConnectButton = memo(({ buttonClassName }: Web3AuthConnectButtonPropsI) => {
  const { isConnected } = useAccount();
  const { error, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const setUserInfo = useSetAtom(socialUserInfoAtom);

  const chainId = useChainId();

  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const chain = chains.find((c) => c.id === chainId);
        const chainConfig = {
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId: numberToHex(chain?.id ?? 0), // Please use 0x1 for Mainnet
          rpcTarget: chain?.rpcUrls.default.http[0] ?? '',
          displayName: chain?.name ?? '',
          blockExplorer: chain?.blockExplorers?.default.url ?? '',
          ticker: chain?.nativeCurrency.symbol ?? '',
          tickerName: chain?.nativeCurrency.name ?? '',
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
                verifier: 'd8x-firebase-test',
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
          setLoggedIn(true);
        }
      } catch (e) {
        console.error(e);
      }
    };

    init();
  }, [chainId]);

  const signInWithTwitter = async () => {
    try {
      console.log('loggedIn', loggedIn);
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
            domain: 'https://1acc-108-30-150-201.ngrok-free.app',
          },
        })
        .catch((e) => console.log(e));

      const info = await web3auth.getUserInfo();
      setUserInfo(info);

      await connectAsync({
        connector: new Web3AuthConnector({
          chains: chains,
          options: {
            web3AuthInstance: web3auth,
            loginParams: {
              loginProvider: 'jwt',
              extraLoginOptions: {
                id_token: idToken,
                verifierIdField: 'sub',
                domain: 'https://1acc-108-30-150-201.ngrok-free.app',
              },
            },
          },
        }),
      }).catch((e) => console.log(e));
    } catch (err) {
      console.error(err);
      // throw err;
    }
  };

  // useEffect(() => {
  //   console.log(web3auth?.connected, isConnected);
  //   if (web3auth?.connected && isConnected) {
  //     web3auth.getUserInfo().then((info) => {
  //       setUserInfo({ ...info, pubKey: '' });
  //     });
  //   }
  // }, [isConnected, web3auth, setUserInfo]);

  const handleDisconnect = () => {
    setUserInfo(null);
    disconnect();
  };

  if (isConnected) {
    return (
      isConnected && (
        <Button
          className={classnames(styles.connectWalletButton, buttonClassName)}
          onClick={handleDisconnect}
          variant="primary"
        >
          Disconnect
        </Button>
      )
    );
  } else {
    return (
      <div className="main">
        {/* {connectors
          .filter((c) => c.name === 'Web3Auth')
          .map((c) => {
            return (
              <Button
                className={classnames(styles.connectWalletButton, buttonClassName)}
                key={c.id}
                onClick={() => connect({ connector: c })}
                variant="primary"
              >
                {c.name}
              </Button>
            );
          })} */}
        {
          <Button
            className={classnames(styles.connectWalletButton, buttonClassName)}
            key={'login'}
            // disabled={!loggedIn}
            onClick={signInWithTwitter}
            variant="primary"
          >
            Login with Twitter
          </Button>
        }
        {error && <div>{error.message}</div>}
      </div>
    );
  }

  // return (
  //   <Button
  //     onClick={() => {
  //       isConnected ? disconnect() : connect({ connector });
  //     }}
  //     className={styles.chainButton}
  //     variant="primary"
  //     title={isConnected ? 'Disconnect' : 'Connect'}
  //   >
  //     {isConnected ? address : 'Twitter'}
  //   </Button>
  // );
});
