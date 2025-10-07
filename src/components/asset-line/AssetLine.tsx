import { DynamicLogo } from 'components/dynamic-logo/DynamicLogo';

import { Button } from '@mui/material';
import { useFundWallet, usePrivy } from '@privy-io/react-auth';
import { useUserWallet } from 'context/user-wallet-context/UserWalletContext';
import { useAtomValue } from 'jotai';
import { useMemo } from 'react';
import { smartAccountClientAtom } from 'store/app.store';
import { MethodE } from 'types/enums';
import { formatEther, zeroAddress } from 'viem';
import { berachain } from 'viem/chains';
import styles from './AssetLine.module.scss';

interface AssetLinePropsI {
  symbol: string;
  value: string | number;
  tokenAddress?: `0x${string}`;
}

export const AssetLine = ({ symbol, value, tokenAddress }: AssetLinePropsI) => {
  const smartAccountClient = useAtomValue(smartAccountClientAtom);

  const { fundWallet } = useFundWallet();
  const { user } = usePrivy();
  const { calculateGasForFee } = useUserWallet();

  const targetAddress = useMemo(() => {
    return smartAccountClient?.account?.address || user?.wallet?.address;
  }, [smartAccountClient, user]);

  const onClick = () => {
    if (tokenAddress === undefined || !targetAddress) {
      console.log('not ready to fund:', { tokenAddress, targetAddress });
      return;
    }

    console.log('this should trigger a fund popup');
    if (tokenAddress === zeroAddress) {
      fundWallet({
        address: targetAddress,
        options: { chain: berachain, amount: formatEther(calculateGasForFee(MethodE.Interact, 10n)) },
      })
        .then(() => {
          console.log('fund gas complete');
        })
        .catch((e) => {
          console.log('error funding gas', e);
        });
    } else {
      fundWallet({
        address: targetAddress,
        options: { chain: berachain, asset: { erc20: tokenAddress }, amount: '1000' },
      })
        .then(() => {
          console.log('fund erc20 complete');
        })
        .catch((e) => {
          console.log('error funding erc20', e);
        });
    }
  };

  return (
    <Button className={styles.root} onClick={onClick}>
      <div className={styles.label}>
        <DynamicLogo logoName={symbol.toLowerCase()} width={24} height={24} />
        <div className={styles.text}>{symbol}</div>
      </div>
      <div>{value}</div>
    </Button>
  );
};
