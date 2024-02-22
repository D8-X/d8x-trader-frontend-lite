import { memo, useEffect, useState } from 'react';

import { Button } from '@mui/material';

import styles from './Web3AuthConnectButton.module.scss';

import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';
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

  const { disconnect } = useDisconnect();
  const setUserInfo = useSetAtom(socialUserInfoAtom);

  const { chain: curChain } = useNetwork();

  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [web3authIdToken, setIdToken] = useState<string | undefined>(undefined);

  const { error, connectAsync } = useConnect({
    connector: new Web3AuthConnector({
      chains: chains,
      options: {
        web3AuthInstance: web3auth,
        loginParams: {
          loginProvider: 'jwt',
          extraLoginOptions: {
            id_token: web3authIdToken,
            verifierIdField: 'sub',
            domain: 'https://1acc-108-30-150-201.ngrok-free.app',
          },
        },
      },
    }),
  });

  useEffect(() => {
    console.log('chainId', curChain?.id);
  }, [curChain]);

  useEffect(() => {
    const init = async () => {
      try {
        // console.log('init: chainId', chainId);
        // const chain = chains.find((c) => c.id === chainId);
        const chain = chains[0];
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

        for (let i = 1; i < chains.length; i++) {
          await web3authInstance.addChain({
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: numberToHex(chains[i].id ?? 0), // Please use 0x1 for Mainnet
            rpcTarget: chains[i].rpcUrls.default.http[0] ?? '',
            displayName: chains[i].name ?? '',
            blockExplorer: chains[i].blockExplorers?.default.url ?? '',
            ticker: chains[i].nativeCurrency.symbol ?? '',
            tickerName: chains[i].nativeCurrency.name ?? '',
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    init();
  }, []);

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
      setIdToken(idToken);

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

      await connectAsync();
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

  // useEffect(() => {
  //   console.log(web3auth?.status, web3auth?.connected);
  //   if (!web3auth || !web3auth.connected || !web3authIdToken || !isIdle) {
  //     return;
  //   }
  //   const adddAndConnect = async () => {
  //     console.log('add and connect', chainId);
  //     const chain = chains.find((c) => c.id === chainId);
  //     const chainConfig = {
  //       chainNamespace: CHAIN_NAMESPACES.EIP155,
  //       chainId: numberToHex(chain?.id ?? 0), // Please use 0x1 for Mainnet
  //       rpcTarget: chain?.rpcUrls.default.http[0] ?? '',
  //       displayName: chain?.name ?? '',
  //       blockExplorer: chain?.blockExplorers?.default.url ?? '',
  //       ticker: chain?.nativeCurrency.symbol ?? '',
  //       tickerName: chain?.nativeCurrency.name ?? '',
  //     };

  //     await web3auth.addChain(chainConfig);
  //     await web3auth.switchChain({ chainId: numberToHex(chainId) });
  //     await connectAsync();
  //   };

  //   adddAndConnect();
  // }, [web3auth, chainId, web3authIdToken, isIdle, connectAsync]);

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
