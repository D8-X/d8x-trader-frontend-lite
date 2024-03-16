import { getPublicKey } from '@noble/secp256k1';
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, Web3AuthNoModalOptions } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter, OpenloginUserInfo } from '@web3auth/openlogin-adapter';
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
} from 'react';
import { bytesToHex, numberToHex } from 'viem';
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi';

import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { web3AuthConfig } from 'config';
import { auth } from 'FireBaseConfig';
import { postSocialVerify } from 'network/referral';
import { accountModalOpenAtom } from 'store/global-modals.store';
import { socialPKAtom, socialUserInfoAtom, web3AuthIdTokenAtom } from 'store/web3-auth.store';

interface Web3AuthContextPropsI {
  web3Auth: Web3AuthNoModal | null;
  disconnect: () => void;
  signInWithTwitter: () => void;
  isConnecting: boolean;
}

const Web3AuthContext = createContext<Web3AuthContextPropsI | undefined>(undefined);

const clientId = web3AuthConfig.web3AuthClientId;
const verifier = web3AuthConfig.web3AuthVerifier;
const web3AuthNetwork = web3AuthConfig.web3AuthNetwork;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: numberToHex(chains[0].id),
  rpcTarget: chains[0].rpcUrls.default.http[0],
  displayName: chains[0].name,
  blockExplorerUrl: chains[0].blockExplorers?.default.url ?? '',
  ticker: chains[0].nativeCurrency.symbol,
  tickerName: chains[0].nativeCurrency.name,
  decimals: chains[0].nativeCurrency.decimals,
  logo: chains[0].iconUrl as string,
  isTestnet: chains[0].testnet,
};

const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

const web3AuthOptions: Web3AuthNoModalOptions = {
  clientId,
  chainConfig,
  web3AuthNetwork,
  privateKeyProvider,
};
const web3AuthInstance = new Web3AuthNoModal(web3AuthOptions);

const openloginAdapter = new OpenloginAdapter({
  privateKeyProvider,
  adapterSettings: {
    uxMode: 'redirect',
    loginConfig: {
      jwt: {
        verifier,
        typeOfLogin: 'jwt',
        clientId,
      },
    },
  },
});

web3AuthInstance.configureAdapter(openloginAdapter);

export const Web3AuthProvider = memo(({ children }: PropsWithChildren) => {
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();

  const setUserInfo = useSetAtom(socialUserInfoAtom);
  const setSocialPK = useSetAtom(socialPKAtom);
  const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
  const [web3AuthIdToken, setWeb3AuthIdToken] = useAtom(web3AuthIdTokenAtom);

  // const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);
  const [web3AuthSigning, setWeb3AuthSigning] = useState(false);

  const [, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  const isInitializingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const signInRef = useRef(false);
  const verifyRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current || clientId === '') {
      return;
    }

    isInitializingRef.current = true;

    const init = async () => {
      try {
        await web3AuthInstance.init();
        setProvider(web3AuthInstance.provider);
        if (web3AuthInstance.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init()
      .then()
      .finally(() => {
        isInitializingRef.current = false;
      });
  }, []);

  const handleWeb3AuthSuccessConnect = useCallback(
    (userInfo: Partial<OpenloginUserInfo>, privateKey: string) => {
      const verify = async () => {
        if (!chainId || !userInfo?.idToken || verifyRef.current || !privateKey) {
          return;
        }
        try {
          verifyRef.current = true;
          const pubKey = bytesToHex(getPublicKey(privateKey));
          await postSocialVerify(chainId, userInfo.idToken, pubKey).catch((e) =>
            console.log('POST /social-verify error', e)
          );
        } catch (error) {
          console.error(error);
        } finally {
          verifyRef.current = false;
        }
      };
      verify().then();
    },
    [chainId]
  );

  // // Connect Web3Auth to OPENLOGIN if we have token ID saved
  // useEffect(() => {
  //   console.log('connectTo(WALLET_ADAPTERS.OPENLOGIN)', {
  //     web3AuthStatus: web3AuthInstance?.status,
  //     web3AuthConnected: web3AuthInstance?.connected,
  //     loggedIn: loggedIn,
  //     web3AuthIdToken,
  //     isConnected,
  //     web3AuthInstance,
  //   });

  //   if (
  //     isConnectedRef.current ||
  //     isInitializingRef.current ||
  //     !web3AuthConfig.web3AuthClientId ||
  //     !web3AuthIdToken ||
  //     !web3AuthInstance ||
  //     isConnected
  //   ) {
  //     return;
  //   }

  //   const connectWeb3Auth = async () => {
  //     setWeb3AuthSigning(true);

  //     if (!web3AuthInstance?.connected) {
  //       await web3AuthInstance
  //         .connectTo(WALLET_ADAPTERS.OPENLOGIN, {
  //           loginProvider: 'jwt',
  //           extraLoginOptions: {
  //             id_token: web3AuthIdToken,
  //             verifierIdField: 'sub',
  //           },
  //         })
  //         .then((provider) => {
  //           setProvider(provider);
  //           setLoggedIn(true);
  //         })
  //         .catch((error) => {
  //           console.error(error);
  //           return null;
  //         });
  //     }

  //     console.log('info & pk', {
  //       web3AuthStatus: web3AuthInstance?.status,
  //       web3AuthConnected: web3AuthInstance?.connected,
  //     });
  //     const info = await web3AuthInstance.getUserInfo();
  //     setUserInfo(info);

  //     const privateKey = await web3AuthInstance.provider?.request({
  //       method: 'eth_private_key',
  //     });
  //     setSocialPK(privateKey as string);

  //     console.log('connectAsync', {
  //       web3AuthStatus: web3AuthInstance?.status,
  //       web3AuthConnected: web3AuthInstance?.connected,
  //     });
  //     await connectAsync({
  //       chainId,
  //       connector: Web3AuthConnector({
  //         web3AuthInstance: web3AuthInstance,
  //         loginParams: {
  //           loginProvider: 'jwt',
  //           extraLoginOptions: {
  //             id_token: web3AuthIdToken,
  //             verifierIdField: 'sub',
  //           },
  //         },
  //         modalConfig: {
  //           openloginAdapter: {
  //             uxMode: 'redirect',
  //             loginConfig: {
  //               jwt: {
  //                 verifier,
  //                 typeOfLogin: 'jwt',
  //                 clientId,
  //               },
  //             },
  //           },
  //         },
  //       }),
  //     });

  //     console.log('successCallback', {
  //       web3AuthStatus: web3AuthInstance?.status,
  //       web3AuthConnected: web3AuthInstance?.connected,
  //     });
  //     handleWeb3AuthSuccessConnect(info, privateKey as string);

  //     setWeb3AuthSigning(false);
  //     isConnectedRef.current = true;
  //   };

  //   connectWeb3Auth().then();
  // }, [
  //   chainId,
  //   loggedIn,
  //   web3AuthIdToken,
  //   connectAsync,
  //   handleWeb3AuthSuccessConnect,
  //   setSocialPK,
  //   setUserInfo,
  //   isConnected,
  // ]);

  useEffect(() => {
    if (!loggedIn || web3AuthIdToken === '') {
      console.log('loggedIn', loggedIn);
      console.log('web3AuthIdToken', web3AuthIdToken);
      return;
    }
    console.log('connectAsync', {
      web3AuthStatus: web3AuthInstance?.status,
      web3AuthConnected: web3AuthInstance?.connected,
    });
    connectAsync({
      chainId,
      connector: Web3AuthConnector({
        web3AuthInstance: web3AuthInstance,
        loginParams: {
          loginProvider: 'jwt',
          extraLoginOptions: {
            id_token: web3AuthIdToken,
            verifierIdField: 'sub',
          },
        },
        modalConfig: {
          openloginAdapter: {
            uxMode: 'redirect',
            loginConfig: {
              jwt: {
                verifier,
                typeOfLogin: 'jwt',
                clientId,
              },
            },
          },
        },
      }),
    }).then();
  }, [chainId, loggedIn, web3AuthIdToken, connectAsync]);

  const connectWeb3Auth = useCallback(
    async (idToken: string) => {
      setWeb3AuthSigning(true);

      if (!web3AuthInstance.connected) {
        console.log({ web3authConnected: web3AuthInstance.connected, loggedIn: loggedIn });
        await web3AuthInstance
          .connectTo(WALLET_ADAPTERS.OPENLOGIN, {
            loginProvider: 'jwt',
            extraLoginOptions: {
              id_token: idToken,
              verifierIdField: 'sub',
            },
          })
          .then((provider) => {
            setProvider(provider);
            setLoggedIn(true);
          })
          .catch((error) => {
            console.error(error);
            return null;
          });
      }

      // console.log('info & pk', {
      //   web3AuthStatus: web3AuthInstance?.status,
      //   web3AuthConnected: web3AuthInstance?.connected,
      // });
      const info = await web3AuthInstance.getUserInfo();
      setUserInfo(info);

      const privateKey = await web3AuthInstance.provider?.request({
        method: 'eth_private_key',
      });
      setSocialPK(privateKey as string);
      // console.log('successCallback', {
      //   web3AuthStatus: web3AuthInstance?.status,
      //   web3AuthConnected: web3AuthInstance?.connected,
      // });
      handleWeb3AuthSuccessConnect(info, privateKey as string);

      setWeb3AuthSigning(false);
      isConnectedRef.current = true;
    },
    [loggedIn, handleWeb3AuthSuccessConnect, setSocialPK, setUserInfo]
  );

  const signInWithTwitter = useCallback(async () => {
    if (!auth || signInRef.current) {
      console.log('auth not defined');
      return;
    }

    if (!web3AuthInstance) {
      console.log('web3Auth not initialized yet');
      return;
    }

    setWeb3AuthSigning(true);
    signInRef.current = true;
    try {
      await disconnectAsync();
      const twitterProvider = new TwitterAuthProvider();
      console.log('signInWithPopup', web3AuthInstance?.status, web3AuthInstance?.connected);
      const loginRes = await signInWithPopup(auth, twitterProvider);

      console.log('login details', loginRes);
      console.log('getIdToken', web3AuthInstance.status, web3AuthInstance.connected);
      const idToken = await loginRes.user.getIdToken(true);
      setWeb3AuthIdToken(idToken);
      await connectWeb3Auth(idToken);
    } catch (error) {
      console.error(error);
    } finally {
      signInRef.current = false;
      setWeb3AuthSigning(false);
    }
  }, [connectWeb3Auth, setWeb3AuthIdToken, disconnectAsync, setWeb3AuthSigning]);

  const handleDisconnect = useCallback(async () => {
    if (isConnected) {
      setUserInfo(null);
      setSocialPK(undefined);
      setAccountModalOpen(false);
      setWeb3AuthIdToken('');
      isConnectedRef.current = false;
      await disconnectAsync();
    }
  }, [setUserInfo, setSocialPK, setWeb3AuthIdToken, setAccountModalOpen, isConnected, disconnectAsync]);

  return (
    <Web3AuthContext.Provider
      value={{
        web3Auth: web3AuthInstance,
        signInWithTwitter,
        disconnect: handleDisconnect,
        isConnecting: web3AuthSigning,
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
