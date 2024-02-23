import { memo, useEffect, useState } from 'react';

import { Button } from '@mui/material';

import styles from './Web3AuthConnectButton.module.scss';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
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

const clientId = config.web3AuthClientId;
const verifierName = config.web3AuthVerifier;
interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
}

export const Web3AuthConnectButton = memo(({ buttonClassName }: Web3AuthConnectButtonPropsI) => {
  const { isConnected } = useAccount();

  const { disconnect } = useDisconnect();
  const setUserInfo = useSetAtom(socialUserInfoAtom);

  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [web3authIdToken, setIdToken] = useState<string | undefined>(undefined);

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
          setLoggedIn(true);
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
            // domain: '...', // example included this, but works without it?
          },
        })
        .catch((e) => console.log(e));

      const info = await web3auth.getUserInfo();
      setUserInfo(info);

      await connectAsync();
    } catch (err) {
      console.error(err);
    }
  };

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
      <Button
        className={classnames(styles.connectWalletButton, buttonClassName)}
        key={'login'}
        disabled={!web3auth}
        onClick={signInWithTwitter}
        variant="primary"
      >
        Login with Twitter
      </Button>
    );
  }
});
