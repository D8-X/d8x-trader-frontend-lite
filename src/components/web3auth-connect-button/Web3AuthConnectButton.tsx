import { memo } from 'react';

import { Button } from '@mui/material';

import styles from './Web3AuthConnectButton.module.scss';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import classnames from 'classnames';
import { NetworkSwitcher } from './NetworkSwitcher';

interface Web3AuthConnectButtonPropsI {
  buttonClassName?: string;
}

export const Web3AuthConnectButton = memo(({ buttonClassName }: Web3AuthConnectButtonPropsI) => {
  const { address, connector, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  // useEffect(() => {
  //   if (isConnected) {
  //     const getUserInfo = async () => {
  //       if (!web3auth || !provider) {
  //         console.log('web3auth not initialized yet');
  //         return;
  //       }
  //       const user = await web3auth.getUserInfo();
  //       const privateKey = await provider.request({
  //         method: 'eth_private_key',
  //       });
  //       setWalletClient(
  //         createWalletClient({
  //           account: privateKeyToAccount(('0x' + privateKey) as Address),
  //           chain: publicClient({ chainId }).chain,
  //           transport: http(),
  //         })
  //       );
  //       console.log(user);
  //     };
  //     getUserInfo();
  //   } else {
  //     setProvider(null);
  //     setWalletClient(null);
  //   }
  // }, [isConnected]);

  if (isConnected) {
    return (
      <div className="main">
        <div className="title">Connected to {connector?.name}</div>
        <div>{address}</div>
        <NetworkSwitcher />
        <Button className="card" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  } else {
    return (
      <div className="main">
        {connectors.map((c) => {
          return (
            <Button
              className={classnames(styles.connectWalletButton, buttonClassName)}
              key={c.id}
              onClick={() => connect({ connector: c })}
            >
              {c.name}
            </Button>
          );
        })}
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
