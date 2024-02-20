import { CHAIN_NAMESPACES, OPENLOGIN_NETWORK } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import { Web3AuthConnector } from '@web3auth/web3auth-wagmi-connector';
import { config } from 'config';
import { numberToHex } from 'viem';
import { Chain } from 'wagmi';

export default function Web3AuthConnectorInstance(chains: Chain[]) {
  // const chainConfig = {
  //   chainNamespace: CHAIN_NAMESPACES.EIP155,
  //   chainId: '0xaa36a7',
  //   rpcTarget: 'https://rpc.ankr.com/eth_sepolia',
  //   displayName: 'Ethereum Sepolia',
  //   blockExplorer: 'https://sepolia.etherscan.io',
  //   ticker: 'ETH',
  //   tickerName: 'Ethereum',
  // };
  // const { chain } = useNetwork();

  // console.log(chain);

  // const chainConfig = {
  //   chainNamespace: CHAIN_NAMESPACES.EIP155,
  //   chainId: toHex(chain?.id ?? 0),
  //   rpcTarget: chain?.rpcUrls.default.http[0] ?? '',
  //   displayName: chain?.name ?? '',
  //   tickerName: chain?.nativeCurrency?.name ?? '',
  //   ticker: chain?.nativeCurrency?.symbol ?? '',
  //   blockExplorer: chain?.blockExplorers?.default.url ?? '',
  // };

  // const setWeb3Auth = useSetAtom(web3AuthAtom);
  const chain = chains[0];
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: numberToHex(chain.id),
    rpcTarget: chain.rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
    displayName: chain.name,
    tickerName: chain.nativeCurrency?.name,
    ticker: chain.nativeCurrency?.symbol,
    blockExplorer: chain.blockExplorers?.default.url[0] as string,
  };

  const web3AuthInstance = new Web3AuthNoModal({
    clientId: config.web3AuthClientId,
    web3AuthNetwork: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET,
    chainConfig,
  });
  const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } });
  const openloginAdapter = new OpenloginAdapter({
    privateKeyProvider,
    loginSettings: {
      curve: 'secp256k1',
    },
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

  chains.slice(1).map((c) =>
    web3AuthInstance.addChain({
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: numberToHex(c.id),
      rpcTarget: c.rpcUrls.default.http[0], // This is the public RPC we have added, please pass on your own endpoint while creating an app
      displayName: c.name,
      tickerName: c.nativeCurrency?.name,
      ticker: c.nativeCurrency?.symbol,
      blockExplorer: c.blockExplorers?.default.url[0] as string,
    })
  );

  return new Web3AuthConnector({
    chains: chains,
    options: {
      web3AuthInstance,
      loginParams: {
        loginProvider: 'twitter',
      },
    },
  });
}
