// import { getPublicKey } from '@noble/secp256k1';
import { ADAPTER_STATUS, CHAIN_NAMESPACES, OPENLOGIN_NETWORK, WALLET_ADAPTERS } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { signInWithPopup, TwitterAuthProvider } from 'firebase/auth';
import { useAtom, useSetAtom } from 'jotai';
import {
  createContext,
  memo,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { numberToHex } from 'viem';
import { useChainId, useConnect, useDisconnect } from 'wagmi';

import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { web3AuthConfig } from 'config';
import { auth } from 'FireBaseConfig';
// import { postSocialVerify } from 'network/referral';
import { accountModalOpenAtom } from 'store/global-modals.store';
import { socialPKAtom, socialUserInfoAtom, web3AuthIdTokenAtom } from 'store/web3-auth.store';

interface Web3AuthContextPropsI {
  web3Auth: Web3AuthNoModal | null;
  disconnect: () => void;
  signInWithTwitter: () => void;
}

const Web3AuthContext = createContext<Web3AuthContextPropsI | undefined>(undefined);

const clientId = web3AuthConfig.web3AuthClientId;
const verifierName = web3AuthConfig.web3AuthVerifier;

export const Web3AuthProvider = memo(({ children }: PropsWithChildren) => {
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();

  const setUserInfo = useSetAtom(socialUserInfoAtom);
  const setSocialPK = useSetAtom(socialPKAtom);
  const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
  const [web3AuthIdToken, setWeb3AuthIdToken] = useAtom(web3AuthIdTokenAtom);

  const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);

  const isInitializingRef = useRef(false);
  const isConnectingRef = useRef(false);
  const signInRef = useRef(false);
  // const verifyRef = useRef(false);

  const chain = useMemo(() => {
    if (!web3AuthConfig.web3AuthClientId) {
      return;
    }
    let activeChainId = chainId;
    const wagmiStore = localStorage.getItem('wagmi.store');
    if (wagmiStore) {
      const parsedStore = JSON.parse(wagmiStore);
      if (parsedStore?.state?.data?.chain?.id) {
        activeChainId = parsedStore.state.data.chain.id;
      }
    }
    return chains.find(({ id }) => id === activeChainId);
  }, [chainId]);

  // create & init web3auth when chain changes
  useEffect(() => {
    if (!chain || isInitializingRef.current || isConnectingRef.current || web3AuthIdToken === '') {
      return;
    }

    isInitializingRef.current = true;

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

        const web3AuthInstance = new Web3AuthNoModal({
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

        web3AuthInstance.configureAdapter(openloginAdapter);

        await web3AuthInstance.init().then(() => {
          console.log('web3auth is now configured and ready to on chain', chain.id);
          setWeb3Auth(web3AuthInstance);

          //   if (isConnectedRef.current || !web3AuthIdToken || web3AuthIdToken === '') {
          //     return;
          //   }

          //   const wagmiConnected = localStorage.getItem('wagmi.connected');
          //   const wagmiLastWallet = localStorage.getItem('wagmi.wallet');

          //   const isWagmiConnected = wagmiConnected ? JSON.parse(wagmiConnected) : false;
          //   const isWeb3Wallet = wagmiLastWallet ? JSON.parse(wagmiLastWallet) === 'web3auth' : false;

          //   if (!isWagmiConnected || !isWeb3Wallet) {
          //     return;
          //   }

          //   isConnectedRef.current = true;

          //   connect({
          //     connector: new Web3AuthConnector({
          //       chains,
          //       options: {
          //         web3AuthInstance,
          //         loginParams: {
          //           loginProvider: 'jwt',
          //           extraLoginOptions: {
          //             id_token: web3AuthIdToken,
          //             verifierIdField: 'sub',
          //             // domain: '...', // example included this, but works without it?
          //           },
          //         },
          //       },
          //     }),
          //   });
        });
      } catch (error) {
        console.error(error);
      }
    };

    init().then(() => {
      isInitializingRef.current = false;
    });
  }, [chain, disconnect]);

  const handleDisconnect = useCallback(() => {
    setUserInfo(null);
    setSocialPK(undefined);
    setWeb3AuthIdToken('');
    setAccountModalOpen(false);
    disconnect();
    setWeb3Auth(null);
  }, [setUserInfo, setSocialPK, setWeb3AuthIdToken, setAccountModalOpen, disconnect]);

  // const handleWeb3AuthSuccessConnect = useCallback(
  //   (userInfo: Partial<OpenloginUserInfo>, privateKey: string) => {
  //     const verify = async () => {
  //       if (!chainId || !userInfo?.idToken || verifyRef.current || !privateKey) {
  //         return;
  //       }
  //       try {
  //         verifyRef.current = true;
  //         const pubKey = bytesToHex(getPublicKey(privateKey));
  //         await postSocialVerify(chainId, userInfo.idToken, pubKey).catch((e) =>
  //           console.log('POST /social-verify error', e)
  //         );
  //       } catch (error) {
  //         console.error(error);
  //       } finally {
  //         verifyRef.current = false;
  //       }
  //     };
  //     verify().then();
  //   },
  //   [chainId]
  // );

  // connect web3auth when user signs in with twitter:
  // should run if web3AuthIdToken is set for the first time (user signs in)
  // or if already set and web3auth instance is recreated
  useEffect(() => {
    console.log('web3auth.connect', !web3Auth, web3Auth?.status, web3AuthIdToken === '');
    if (!web3Auth || web3AuthIdToken === '' || isConnectingRef.current) {
      return;
    }
    isConnectingRef.current = true;
    disconnect();

    const connectWeb3 = async () => {
      if (web3Auth.status !== ADAPTER_STATUS.CONNECTED && web3Auth.status !== ADAPTER_STATUS.CONNECTING) {
        await web3Auth
          .connectTo(WALLET_ADAPTERS.OPENLOGIN, {
            loginProvider: 'jwt',
            extraLoginOptions: {
              id_token: web3AuthIdToken,
              verifierIdField: 'sub',
            },
          })
          .catch(async (e) => {
            console.log(e);
            await web3Auth.logout();
          });
        const privateKey = (await web3Auth.provider?.request({
          method: 'eth_private_key',
        })) as string;
        setSocialPK(privateKey);
      }

      if (web3Auth.status === ADAPTER_STATUS.CONNECTED) {
        await connectAsync({
          connector: new Web3AuthConnector({
            chains,
            options: {
              web3AuthInstance: web3Auth,
              loginParams: {
                loginProvider: 'jwt',
                extraLoginOptions: {
                  id_token: web3AuthIdToken,
                  verifierIdField: 'sub',
                },
              },
            },
          }),
        });
      }
    };

    // handleWeb3AuthSuccessConnect(info, privateKey as string);
    connectWeb3()
      .then(() => {
        isConnectingRef.current = false;
      })
      .catch((e) => {
        console.log(e);
      });
    // console.log('info & pk', web3Auth.status, web3Auth.connected);
    // const info = await web3Auth.getUserInfo();
    // const privateKey = await web3Auth.provider?.request({
    //   method: 'eth_private_key',
    // });
    // console.log('connectAsync', web3Auth.status, web3Auth.connected);
    // await connectAsync({
    //   connector: new Web3AuthConnector({
    //     chains,
    //     options: {
    //       web3AuthInstance: web3Auth,
    //       loginParams: {
    //         loginProvider: 'jwt',
    //         extraLoginOptions: {
    //           id_token: web3AuthIdToken,
    //           verifierIdField: 'sub',
    //           // domain: '...', // example included this, but works without it?
    //         },
    //       },
    //     },
    //   }),
    // });
    // setUserInfo(info);

    // setSocialPK(privateKey as string);
    // console.log('successCallback', web3Auth.status, web3Auth.connected);
    // handleWeb3AuthSuccessConnect(info, privateKey as string);
  }, [web3Auth, web3AuthIdToken, disconnect, connectAsync, setSocialPK]);

  const signInWithTwitter = useCallback(async () => {
    if (!auth || signInRef.current) {
      console.log('auth not defined');
      return;
    }
    signInRef.current = true;
    try {
      const twitterProvider = new TwitterAuthProvider();
      const loginRes = await signInWithPopup(auth, twitterProvider);
      const idToken = await loginRes.user.getIdToken(true);
      setWeb3AuthIdToken(idToken);
    } catch (error) {
      console.error(error);
    } finally {
      signInRef.current = false;
    }
  }, [setWeb3AuthIdToken]);

  return (
    <Web3AuthContext.Provider
      value={{
        web3Auth,
        disconnect: handleDisconnect,
        signInWithTwitter,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
});

export const useWeb3Auth = () => {
  const context = useContext(Web3AuthContext);
  if (!context) {
    throw new Error('useWeb3Auth must be used within a Web3AuthContext');
  }
  return {
    ...context,
  };
};
