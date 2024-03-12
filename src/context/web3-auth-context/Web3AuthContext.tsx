import { getPublicKey } from '@noble/secp256k1';
import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK, WALLET_ADAPTERS, Web3AuthNoModalOptions } from '@web3auth/base';
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
  useMemo,
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
const verifierName = web3AuthConfig.web3AuthVerifier;

export const Web3AuthProvider = memo(({ children }: PropsWithChildren) => {
  const chainId = useChainId();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { isConnected } = useAccount();

  const setUserInfo = useSetAtom(socialUserInfoAtom);
  const setSocialPK = useSetAtom(socialPKAtom);
  const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
  const [web3AuthIdToken, setWeb3AuthIdToken] = useAtom(web3AuthIdTokenAtom);

  const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);
  const [web3AuthSigning, setWeb3AuthSigning] = useState(false);

  const isInitializingRef = useRef(false);
  const isInstanceCreatedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const signInRef = useRef(false);
  const verifyRef = useRef(false);

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

  useEffect(() => {
    if (
      !chain ||
      !web3AuthConfig.web3AuthClientId ||
      isInitializingRef.current ||
      isInstanceCreatedRef.current ||
      isConnected
    ) {
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
          blockExplorerUrl: chain.blockExplorers?.default.url ?? '',
          ticker: chain.nativeCurrency.symbol,
          tickerName: chain.nativeCurrency.name,
          decimals: chain.nativeCurrency.decimals,
          logo: chain.iconUrl as string,
          isTestnet: chain.testnet,
        };

        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });

        const web3AuthOptions: Web3AuthNoModalOptions = {
          clientId,
          chainConfig,
          web3AuthNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
          privateKeyProvider,
        };
        const web3AuthInstance = new Web3AuthNoModal(web3AuthOptions);

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

        await web3AuthInstance.init();

        // so we can switch chains
        for (let i = 0; i < chains.length; i++) {
          await web3AuthInstance.addChain({
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: numberToHex(chains[i].id ?? 0),
            rpcTarget: chains[i].rpcUrls.default.http[0] ?? '',
            displayName: chains[i].name ?? '',
            blockExplorerUrl: chains[i].blockExplorers?.default.url ?? '',
            ticker: chains[i].nativeCurrency.symbol ?? '',
            tickerName: chains[i].nativeCurrency.name ?? '',
          });
        }
        setWeb3Auth(web3AuthInstance);
      } catch (error) {
        console.error(error);
      }
    };

    init().then(() => {
      isInstanceCreatedRef.current = true;
      isInitializingRef.current = false;
    });
  }, [chain, isConnected]);

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

  // Connect Web3Auth to OPENLOGIN if we have token ID saved
  useEffect(() => {
    console.log('connectTo(WALLET_ADAPTERS.OPENLOGIN)', {
      web3AuthStatus: web3Auth?.status,
      web3AuthConnected: web3Auth?.connected,
      web3AuthIdToken,
      isConnected,
      web3Auth,
    });

    if (
      isConnectedRef.current ||
      !chain ||
      !web3AuthConfig.web3AuthClientId ||
      !web3AuthIdToken ||
      !web3Auth ||
      isConnected
    ) {
      return;
    }

    const connectWeb3Auth = async () => {
      setWeb3AuthSigning(true);

      await web3Auth
        .connectTo(WALLET_ADAPTERS.OPENLOGIN, {
          loginProvider: 'jwt',
          extraLoginOptions: {
            id_token: web3AuthIdToken,
            verifierIdField: 'sub',
          },
        })
        .catch((error) => {
          console.error(error);
        });

      console.log('info & pk', {
        web3AuthStatus: web3Auth?.status,
        web3AuthConnected: web3Auth?.connected,
      });
      const info = await web3Auth.getUserInfo();
      setUserInfo(info);

      const privateKey = await web3Auth.provider?.request({
        method: 'eth_private_key',
      });
      setSocialPK(privateKey as string);

      console.log('connectAsync', {
        web3AuthStatus: web3Auth?.status,
        web3AuthConnected: web3Auth?.connected,
      });
      await connectAsync({
        chainId: chain.id,
        connector: Web3AuthConnector({
          web3AuthInstance: web3Auth,
          loginParams: {
            loginProvider: 'jwt',
            extraLoginOptions: {
              id_token: web3AuthIdToken,
              verifierIdField: 'sub',
              // domain: '...', // example included this, but works without it?
            },
          },
          modalConfig: {
            openloginAdapter: {
              uxMode: 'popup',
              loginConfig: {
                jwt: {
                  verifier: verifierName,
                  typeOfLogin: 'jwt',
                  clientId,
                },
              },
            },
          },
        }),
      });

      console.log('successCallback', {
        web3AuthStatus: web3Auth?.status,
        web3AuthConnected: web3Auth?.connected,
      });
      handleWeb3AuthSuccessConnect(info, privateKey as string);

      setWeb3AuthSigning(false);
      isConnectedRef.current = true;
    };

    connectWeb3Auth().then();
  }, [
    chain,
    web3Auth,
    web3AuthIdToken,
    connectAsync,
    handleWeb3AuthSuccessConnect,
    setSocialPK,
    setUserInfo,
    isConnected,
  ]);

  const signInWithTwitter = useCallback(async () => {
    if (!auth || signInRef.current) {
      console.log('auth not defined');
      return;
    }

    if (!web3Auth) {
      console.log('web3Auth not initialized yet');
      return;
    }

    setWeb3AuthSigning(true);
    signInRef.current = true;
    try {
      const twitterProvider = new TwitterAuthProvider();
      console.log('signInWithPopup', web3Auth?.status, web3Auth?.connected);
      const loginRes = await signInWithPopup(auth, twitterProvider);

      console.log('login details', loginRes);
      console.log('getIdToken', web3Auth.status, web3Auth.connected);
      const idToken = await loginRes.user.getIdToken(true);
      setWeb3AuthIdToken(idToken);
    } catch (error) {
      console.error(error);
    } finally {
      signInRef.current = false;
    }
  }, [setWeb3AuthIdToken, web3Auth]);

  const handleDisconnect = useCallback(async () => {
    if (web3Auth && web3Auth.connected) {
      await disconnectAsync();
      setUserInfo(null);
      setSocialPK(undefined);
      setAccountModalOpen(false);
      setWeb3AuthIdToken('');
      isConnectedRef.current = false;
    }
  }, [setUserInfo, setSocialPK, setWeb3AuthIdToken, setAccountModalOpen, web3Auth, disconnectAsync]);

  return (
    <Web3AuthContext.Provider
      value={{
        web3Auth,
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
