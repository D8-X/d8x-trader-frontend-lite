import { memo, useEffect, useState } from 'react';

// import { useChainId } from 'wagmi';

import { Button } from '@mui/material';

import { config } from 'config';

import styles from './Web3AuthConnectButton.module.scss';
import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK, WALLET_ADAPTERS, IProvider } from '@web3auth/base';
// import { Web3Auth } from '@web3auth/modal';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import * as allChains from 'viem/chains';
import { walletClientAtom } from 'store/app.store';
import { useSetAtom } from 'jotai';
import { Address, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { publicClient } from 'blockchain-api/wagmi/wagmiClient';

// const name = 'Web3Auth';
// const iconUrl = 'https://avatars.githubusercontent.com/u/2824157?s=280&v=4';
const clientId = config.web3AuthClientId;
// const disabledMethods = [
//   'google',
//   'facebook',
//   'reddit',
//   'discord',
//   'twitch',
//   'apple',
//   'line',
//   'github',
//   'kakao',
//   'linkedin',
//   'weibo',
//   'wechat',
//   // 'email_passwordless',
//   'sms_passwordless',
// ];

/**
 * Gets the chain object for the given chain id.
 * @param chainId - Chain id of the target EVM chain.
 * @returns Viem's chain object.
 */
function getChain(chainId: number) {
  for (const chain of Object.values(allChains)) {
    if (chain.id === chainId) {
      return chain;
    }
  }

  throw new Error(`Chain with id ${chainId} not found`);
}

export const Web3AuthConnectButton = memo(() => {
  const chainId = 1;
  const setWalletClient = useSetAtom(walletClientAtom);
  const chain = getChain(chainId);
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const chainConfig = {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: '0x' + chain.id.toString(16),
      rpcTarget: chain.rpcUrls.default.http[0],
      displayName: chain.name,
      tickerName: chain.nativeCurrency?.name,
      ticker: chain.nativeCurrency?.symbol,
      blockExplorer: '',
    };
    // const chainConfig = {
    //   chainNamespace: CHAIN_NAMESPACES.EIP155,
    //   chainId: '0xaa36a7',
    //   rpcTarget: 'https://rpc.ankr.com/eth_sepolia',
    //   displayName: 'Ethereum Sepolia',
    //   blockExplorer: 'https://sepolia.etherscan.io',
    //   ticker: 'ETH',
    //   tickerName: 'Ethereum',
    // };
    const init = async () => {
      try {
        // Create Web3Auth Instance
        // const web3AuthInstance = new Web3Auth({
        //   clientId: clientId,
        //   chainConfig,
        //   web3AuthNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
        // });
        const web3AuthInstance = new Web3AuthNoModal({
          clientId,
          chainConfig,
          web3AuthNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
        });

        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
        const openloginAdapter = new OpenloginAdapter({
          privateKeyProvider,
          adapterSettings: {
            uxMode: 'popup',
            whiteLabel: {
              appName: 'D8X',
            },
            loginConfig: {
              jwt: {
                verifier: 'd8x-test', // Verifier name
                typeOfLogin: 'jwt',
                clientId: 'YwsAsnbGPju3zXfqayLgBbla85fSp56X', // Auth0 `Client ID`
              },
            },
          },
        });
        web3AuthInstance.configureAdapter(openloginAdapter);
        setWeb3auth(web3AuthInstance);
        await web3AuthInstance.init();
        setProvider(web3AuthInstance.provider);
        if (web3AuthInstance.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, [chain]);

  const login = async () => {
    if (!web3auth) {
      console.log('web3auth not initialized yet');
      return;
    }
    // await web3auth.connect();
    const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
      loginProvider: 'twitter',
    });
    setProvider(web3authProvider);
    setLoggedIn(true);
    console.log('logged in');
  };

  const logout = async () => {
    if (!web3auth) {
      console.log('web3auth not initialized yet');
      return;
    }
    await web3auth.logout();

    setLoggedIn(false);

    console.log('logged out');
  };

  useEffect(() => {
    if (loggedIn) {
      const getUserInfo = async () => {
        if (!web3auth || !provider) {
          console.log('web3auth not initialized yet');
          return;
        }
        const user = await web3auth.getUserInfo();
        const privateKey = await provider.request({
          method: 'eth_private_key',
        });
        setWalletClient(
          createWalletClient({
            account: privateKeyToAccount(('0x' + privateKey) as Address),
            chain: publicClient({ chainId }).chain,
            transport: http(),
          })
        );
        console.log(user);
      };
      getUserInfo();
    } else {
      setProvider(null);
      setWalletClient(null);
    }
  }, [loggedIn, web3auth, provider, setWalletClient]);

  return (
    <Button
      onClick={() => {
        loggedIn ? logout() : login();
      }}
      className={styles.chainButton}
      variant="primary"
      title={loggedIn ? 'Disconnect' : 'Connect'}
    >
      {loggedIn ? 'Disconnect Twitter' : 'Connect Twitter'}
    </Button>
  );
});
