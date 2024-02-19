import { Button } from '@mui/material';
import { useAtomValue } from 'jotai';
import { web3AuthAtom } from 'store/app.store';
import { numberToHex } from 'viem';
import { useNetwork, usePublicClient, useSwitchNetwork, useWalletClient } from 'wagmi';

export const NetworkSwitcher = () => {
  const { chain } = useNetwork();
  const { chains, error, pendingChainId, switchNetwork, status } = useSwitchNetwork();
  const walletClient = useWalletClient();
  const publicClient = usePublicClient();

  const web3Auth = useAtomValue(web3AuthAtom);

  return (
    <div>
      {chain && (
        <div>
          Using {chain.name} useNetwork, {walletClient.data?.chain.id} walletClient , {publicClient.chain.id}{' '}
          publicClient ,
        </div>
      )}

      {chains.map((x) => (
        <Button
          disabled={!switchNetwork || x.id === chain?.id}
          key={x.id}
          onClick={() => {
            switchNetwork?.(x.id);
            web3Auth?.switchChain({ chainId: numberToHex(x.id) });
          }}
        >
          Switch to {x.name}
          {status === 'loading' && x.id === pendingChainId && '…'}
        </Button>
      ))}

      <div>{error && (error?.message ?? 'Failed to switch')}</div>
    </div>
  );
};
