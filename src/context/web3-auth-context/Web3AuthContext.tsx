import { CHAIN_NAMESPACES, WALLET_ADAPTERS, Web3AuthNoModalOptions } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { type OPENLOGIN_NETWORK_TYPE, OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { signInWithPopup, TwitterAuthProvider, GoogleAuthProvider } from 'firebase/auth';
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
import { numberToHex } from 'viem';
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi';

import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { web3AuthConfig } from 'config';
import { auth } from 'FireBaseConfig';
import { accountModalOpenAtom } from 'store/global-modals.store';
import { socialPKAtom, socialUserInfoAtom, web3AuthIdTokenAtom } from 'store/web3-auth.store';

interface Web3AuthContextPropsI {
  web3Auth: Web3AuthNoModal | null;
  disconnect: () => void;
  signInWithTwitter: () => void;
  signInWithGoogle: () => void;
  isConnecting: boolean;
  isConnected: boolean;
}

const Web3AuthContext = createContext<Web3AuthContextPropsI | undefined>(undefined);

let clientId = '';
let verifier = '';
let web3AuthNetwork: OPENLOGIN_NETWORK_TYPE;
let web3AuthInstance: Web3AuthNoModal | null = null;

if (web3AuthConfig.isEnabled) {
  clientId = web3AuthConfig.web3AuthClientId;
  verifier = web3AuthConfig.web3AuthVerifier;
  web3AuthNetwork = web3AuthConfig.web3AuthNetwork;

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
  web3AuthInstance = new Web3AuthNoModal(web3AuthOptions);

  const openloginAdapter = new OpenloginAdapter({
    privateKeyProvider,
    adapterSettings: {
      uxMode: 'redirect',
      originData: {
        ['https://dev.d8x-testnet.pages.dev']:
          'MEQCIFh3Y9quJU21aHiv7RAq8c2olr4O6XjcigXzlo3PYIfnAiAvAtSfzO0hEQO-WdzIoN87iapBxVY9fFWDD65nmSA0ig',
      },
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
}

export const Web3AuthProvider = memo(({ children }: PropsWithChildren) => {
  const chainId = useChainId();
  const { connect } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();

  const setUserInfo = useSetAtom(socialUserInfoAtom);
  const setSocialPK = useSetAtom(socialPKAtom);
  const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
  const [web3AuthIdToken, setWeb3AuthIdToken] = useAtom(web3AuthIdTokenAtom);

  const [web3AuthSigning, setWeb3AuthSigning] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const isInitializingRef = useRef(false);
  const signInRef = useRef(false);
  // const verifyRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current || !web3AuthInstance || clientId === '') {
      return;
    }

    isInitializingRef.current = true;

    const init = async () => {
      try {
        await web3AuthInstance.init();
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

  // TODO: VOV: Need to find a better way to send info about SocialVerify
  /*
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
   */

  const applyUserInfo = useCallback(async () => {
    if (web3AuthInstance?.connected) {
      const info = await web3AuthInstance.getUserInfo();
      setUserInfo(info);
    } else {
      setUserInfo(null);
    }
  }, [setUserInfo]);

  const applySocialPK = useCallback(async () => {
    if (web3AuthInstance?.connected) {
      const privateKey = (await web3AuthInstance.provider?.request({
        method: 'eth_private_key',
      })) as string;
      setSocialPK(privateKey);
    } else {
      setSocialPK(null);
    }
  }, [setSocialPK]);

  useEffect(() => {
    if (!loggedIn || web3AuthIdToken === '' || !web3AuthInstance || isConnected) {
      return;
    }
    /*console.log('connect', {
      web3AuthStatus: web3AuthInstance?.status,
      web3AuthConnected: web3AuthInstance?.connected,
    });*/
    connect({
      chainId,
      connector: Web3AuthConnector({
        web3AuthInstance,
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
    });

    applyUserInfo().then();
    applySocialPK().then();
  }, [chainId, loggedIn, web3AuthIdToken, connect, isConnected, applyUserInfo, applySocialPK]);

  const connectWeb3Auth = useCallback(
    async (idToken: string) => {
      if (web3AuthInstance && !web3AuthInstance.connected) {
        await web3AuthInstance
          .connectTo(WALLET_ADAPTERS.OPENLOGIN, {
            loginProvider: 'jwt',
            extraLoginOptions: {
              id_token: idToken,
              verifierIdField: 'sub',
            },
          })
          .then(() => {
            setLoggedIn(true);
          })
          .catch((error) => {
            console.error(error);
            setWeb3AuthSigning(false);
            return null;
          });
      }

      // handleWeb3AuthSuccessConnect(info, privateKey as string);
    },
    // [loggedIn, handleWeb3AuthSuccessConnect, setSocialPK, setUserInfo]
    []
  );

  const signInWithTwitter = useCallback(async () => {
    if (!auth || signInRef.current) {
      //console.log('auth not defined');
      return;
    }

    setWeb3AuthSigning(true);
    signInRef.current = true;
    try {
      await disconnectAsync();
      const twitterProvider = new TwitterAuthProvider();
      //console.log('signInWithPopup', web3AuthInstance?.status, web3AuthInstance?.connected);
      const loginRes = await signInWithPopup(auth, twitterProvider);
      //console.log('login details', loginRes);
      //console.log('getIdToken', web3AuthInstance.status, web3AuthInstance.connected);
      const idToken = await loginRes.user.getIdToken(true);
      setWeb3AuthIdToken(idToken);
      await connectWeb3Auth(idToken);
    } catch (error) {
      console.error(error);
    } finally {
      signInRef.current = false;
    }
  }, [connectWeb3Auth, setWeb3AuthIdToken, disconnectAsync, setWeb3AuthSigning]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || signInRef.current) {
      //console.log('auth not defined');
      return;
    }

    setWeb3AuthSigning(true);
    signInRef.current = true;
    try {
      await disconnectAsync();
      const googleProvider = new GoogleAuthProvider();
      //console.log('signInWithPopup', web3AuthInstance?.status, web3AuthInstance?.connected);
      const loginRes = await signInWithPopup(auth, googleProvider);
      //console.log('login details', loginRes);
      //console.log('getIdToken', web3AuthInstance.status, web3AuthInstance.connected);
      const idToken = await loginRes.user.getIdToken(true);
      setWeb3AuthIdToken(idToken);
      await connectWeb3Auth(idToken);
    } catch (error) {
      console.error(error);
    } finally {
      signInRef.current = false;
    }
  }, [connectWeb3Auth, setWeb3AuthIdToken, disconnectAsync, setWeb3AuthSigning]);

  const handleDisconnect = useCallback(async () => {
    if (isConnected) {
      setUserInfo(null);
      setSocialPK(null);
      setAccountModalOpen(false);
      setWeb3AuthIdToken('');
      setLoggedIn(false);
      await disconnectAsync();
    }
  }, [setUserInfo, setSocialPK, setWeb3AuthIdToken, setAccountModalOpen, isConnected, disconnectAsync]);

  return (
    <Web3AuthContext.Provider
      value={{
        web3Auth: web3AuthInstance,
        signInWithTwitter,
        signInWithGoogle,
        disconnect: handleDisconnect,
        isConnecting: web3AuthSigning,
        isConnected: web3AuthInstance ? web3AuthInstance.connected : false,
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
