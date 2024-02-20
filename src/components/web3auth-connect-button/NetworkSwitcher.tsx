import { Button } from '@mui/material';
import { useNetwork, usePublicClient, useSwitchNetwork, useWalletClient } from 'wagmi';

export const NetworkSwitcher = () => {
  const { chain } = useNetwork();
  const { chains, error, pendingChainId, switchNetwork, status } = useSwitchNetwork();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  return (
    <div>
      {chain && (
        <div>
          Using {chain.name} useNetwork, {walletClient?.chain.id} walletClient , {publicClient.chain.id} publicClient ,
        </div>
      )}

      {chains.map((x) => (
        <Button
          disabled={!switchNetwork || x.id === walletClient?.chain.id}
          key={x.id}
          onClick={() => switchNetwork?.(x.id)}
        >
          Switch to {x.name} {status}
          {status === 'loading' && x.id === pendingChainId && '…'}
        </Button>
      ))}

      <div>{error && (error?.message ?? 'Failed to switch')}</div>
    </div>
  );
};
