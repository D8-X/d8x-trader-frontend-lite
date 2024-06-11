import { DataItemI } from './types';

import TurtleEtherFiLogo from '../assets/etherFiTurtleLogo.svg?react';

export const boostsPerSymbol: Record<string, DataItemI[]> = {
  STUSD: [],
  WEETH: [
    {
      label: 'Turtle Ether.fi Points',
      logo: <TurtleEtherFiLogo />,
      translationKey: 'turtle-ether-fi-points',
    },
  ],
};
