import { getPublicKey } from '@noble/secp256k1';
import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK, WALLET_ADAPTERS } from '@web3auth/base';
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
import { useChainId, useConnect, useDisconnect } from 'wagmi';

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
}

const Web3AuthContext = createContext<Web3AuthContextPropsI | undefined>(undefined);

const clientId = web3AuthConfig.web3AuthClientId;
const verifierName = web3AuthConfig.web3AuthVerifier;

export const Web3AuthProvider = memo(({ children }: PropsWithChildren) => {
  const chainId = useChainId();
  const { connect, connectAsync } = useConnect();
  const { disconnect } = useDisconnect();

  const setUserInfo = useSetAtom(socialUserInfoAtom);
  const setSocialPK = useSetAtom(socialPKAtom);
  const setAccountModalOpen = useSetAtom(accountModalOpenAtom);
  const [web3AuthIdToken, setWeb3AuthIdToken] = useAtom(web3AuthIdTokenAtom);

  const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal | null>(null);

  const isInstanceCreatedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const signInRef = useRef(false);
  const verifyRef = useRef(false);

  useEffect(() => {
    if (!web3AuthConfig.web3AuthClientId && isInstanceCreatedRef.current) {
      return;
    }

    let activeChainId = chainId;
    const wagmiStore = localStorage.getItem('wagmi.store');
    if (wagmiStore) {
      const parsedStore = JSON.parse(wagmiStore);
      console.log({ parsedStore });
      if (parsedStore?.state?.data?.chain?.id) {
        activeChainId = parsedStore.state.data.chain.id;
      }
    }

    const chain = chains.find(({ id }) => id === activeChainId);
    if (!chain) {
      return;
    }

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
        setWeb3Auth(web3AuthInstance);

        // TODO: remove this
        console.log('init', web3AuthInstance.status, web3AuthInstance.connected);
        await web3AuthInstance.init().then(() => {
          if (isConnectedRef.current || !web3AuthIdToken) {
            return;
          }

          // if wagmi.connected set to true, then wagmi will not show modal
          // to reconnect user wallet, but instead will use prev connection
          // I found this example in this public repo: https://github.com/sumicet/web3auth-modal-wagmi
          const wagmiConnected = localStorage.getItem('wagmi.connected');
          const wagmiLastWallet = localStorage.getItem('wagmi.wallet');

          const isWagmiConnected = wagmiConnected ? JSON.parse(wagmiConnected) : false;
          const isWeb3Wallet = wagmiLastWallet ? JSON.parse(wagmiLastWallet) === 'web3auth' : false;

          if (!isWagmiConnected || !isWeb3Wallet) {
            return;
          }

          isConnectedRef.current = true;

          connect({
            connector: new Web3AuthConnector({
              chains,
              options: {
                web3AuthInstance,
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
        });

        // if (web3AuthInstance.provider) {
        //   setWeb3authProvider(web3AuthInstance.provider);
        // }
        // so we can switch chains
        for (let i = 1; i < chains.length; i++) {
          await web3AuthInstance.addChain({
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId: numberToHex(chains[i].id ?? 0),
            rpcTarget: chains[i].rpcUrls.default.http[0] ?? '',
            displayName: chains[i].name ?? '',
            blockExplorer: chains[i].blockExplorers?.default.url ?? '',
            ticker: chains[i].nativeCurrency.symbol ?? '',
            tickerName: chains[i].nativeCurrency.name ?? '',
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    init().then(() => {
      isInstanceCreatedRef.current = true;
    });
  }, [chainId, web3AuthIdToken, connect]);

  const handleDisconnect = useCallback(() => {
    setUserInfo(null);
    setSocialPK(undefined);
    setWeb3AuthIdToken('');
    setAccountModalOpen(false);
    disconnect();
    setWeb3Auth(null);
  }, [setUserInfo, setSocialPK, setWeb3AuthIdToken, setAccountModalOpen, disconnect]);

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

  const signInWithTwitter = useCallback(async () => {
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
        .catch((error) => {
          console.error(error);
        });
      console.log('info & pk', web3Auth.status, web3Auth.connected);
      const info = await web3Auth.getUserInfo();
      const privateKey = await web3Auth.provider?.request({
        method: 'eth_private_key',
      });
      console.log('connectAsync', web3Auth.status, web3Auth.connected);
      await connectAsync({
        connector: new Web3AuthConnector({
          chains,
          options: {
            web3AuthInstance: web3Auth,
            loginParams: {
              loginProvider: 'jwt',
              extraLoginOptions: {
                id_token: idToken,
                verifierIdField: 'sub',
                // domain: '...', // example included this, but works without it?
              },
            },
          },
        }),
      });
      setUserInfo(info);
      setWeb3AuthIdToken(idToken);
      setSocialPK(privateKey as string);
      console.log('successCallback', web3Auth.status, web3Auth.connected);
      handleWeb3AuthSuccessConnect(info, privateKey as string);
    } catch (error) {
      console.error(error);
    } finally {
      signInRef.current = false;
    }
  }, [connectAsync, handleWeb3AuthSuccessConnect, setSocialPK, setUserInfo, setWeb3AuthIdToken, web3Auth]);

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
