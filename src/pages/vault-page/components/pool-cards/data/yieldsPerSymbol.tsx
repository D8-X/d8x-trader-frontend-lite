import { DataItemI } from './types';

import EigenLayerLogo from '../assets/eigenLayerLogo.svg?react';
import EtherFiLogo from '../assets/etherFiLogo.svg?react';
import StUSDLogo from '../assets/stusdLogo.svg?react';
import WeETHLogo from '../assets/weethLogo.svg?react';

export const yieldsPerSymbol: Record<string, DataItemI[]> = {
  STUSD: [
    {
      label: 'stUSD Yield',
      logo: <StUSDLogo />,
      translationKey: 'stusd-yield',
    },
  ],
  WEETH: [
    {
      label: 'weETH Staking Yield',
      logo: <WeETHLogo />,
      translationKey: 'weeth-yield',
    },
    {
      label: 'Ether.fi Points',
      logo: <EtherFiLogo />,
      translationKey: 'ether-fi-points',
    },
    {
      label: 'EigenLayer Points',
      logo: <EigenLayerLogo />,
      isRounded: true,
      logoBackground: 'white',
      translationKey: 'eigen-layer-points',
    },
  ],
};
