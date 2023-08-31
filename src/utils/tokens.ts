import { FC, SVGProps } from 'react';
import { ReactComponent as BTCIcon } from '../../node_modules/cryptocurrency-icons/svg/color/btc.svg';
import { ReactComponent as CHZIcon } from '../../node_modules/cryptocurrency-icons/svg/color/chz.svg';
import { ReactComponent as ETHIcon } from '../../node_modules/cryptocurrency-icons/svg/color/eth.svg';
import { ReactComponent as GBPIcon } from '../../node_modules/cryptocurrency-icons/svg/color/gbp.svg';
import { ReactComponent as GenericIcon } from '../../node_modules/cryptocurrency-icons/svg/color/generic.svg';
import { ReactComponent as MaticIcon } from '../../node_modules/cryptocurrency-icons/svg/color/matic.svg';

interface TokenI {
  icon: FC<SVGProps<SVGSVGElement>>;
}

export const tokensIconsMap: Record<string, TokenI> = {
  matic: {
    icon: MaticIcon,
  },
  btc: {
    icon: BTCIcon,
  },
  eth: {
    icon: ETHIcon,
  },
  gbp: {
    icon: GBPIcon,
  },
  chz: {
    icon: CHZIcon,
  },
  default: {
    icon: GenericIcon,
  },
};
