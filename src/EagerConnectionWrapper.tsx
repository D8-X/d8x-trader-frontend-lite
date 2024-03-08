import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { useAtomValue, useSetAtom } from 'jotai';
import { ReactNode, useEffect, useRef } from 'react';
import { numberToHex } from 'viem';
import { useAccount, useChainId, useConnect } from 'wagmi';

import { chains } from 'blockchain-api/wagmi/wagmiClient';
import { web3AuthConfig } from 'config';
import { web3authAtom, web3authIdTokenAtom } from 'store/web3-auth.store';

const clientId = web3AuthConfig.web3AuthClientId;
const verifierName = web3AuthConfig.web3AuthVerifier;

export const EagerConnectionWrapper = ({ children }: { children: ReactNode }) => {
  const { connect } = useConnect();
  const { isDisconnected } = useAccount();
  const chainId = useChainId();

  const web3authIdToken = useAtomValue(web3authIdTokenAtom);
  const setWeb3Auth = useSetAtom(web3authAtom);

  const isInstanceCreatedRef = useRef(false);

  useEffect(() => {
    if (!isDisconnected || isInstanceCreatedRef.current) {
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

    const chain = chains.find(({ id }) => id === chainId);
    if (!chain) {
      return;
    }

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

    web3authInstance.init().then(() => {
      connect({
        connector: new Web3AuthConnector({
          chains,
          options: {
            web3AuthInstance: web3authInstance,
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
    });

    setWeb3Auth(web3authInstance);
    isInstanceCreatedRef.current = true;
  }, [connect, isDisconnected, chainId, web3authIdToken, setWeb3Auth]);

  return children;
};
