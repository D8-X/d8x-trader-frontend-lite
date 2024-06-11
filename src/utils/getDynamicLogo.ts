import { type ComponentType, lazy, type LazyExoticComponent, type ReactElement, type ReactNode } from 'react';

import { TemporaryAnyT } from 'types/types';

const importedLogos: Record<string, ReactElement<TemporaryAnyT>> = {};

export const getDynamicLogo = (symbol: string): LazyExoticComponent<ComponentType<ReactNode>> =>
  lazy(async () => {
    const importedLogo = importedLogos[symbol];
    if (importedLogo) {
      return {
        default: importedLogo,
      };
    }
    try {
      const libraryLogo = (await import(`../../node_modules/cryptocurrency-icons/svg/color/${symbol}.svg`)).default;
      importedLogos[symbol] = libraryLogo;
      return {
        default: libraryLogo,
      };
    } catch {
      /* continue regardless of error */
    }

    try {
      let localLogo: TemporaryAnyT;
      switch (symbol) {
        case 'weeth':
          localLogo = (await import('assets/crypto-icons/weeth.svg')).default;
          break;
        case 'stusd':
          localLogo = (await import('assets/crypto-icons/stusd.svg')).default;
          break;
        case 'wokb':
        case 'okb':
          localLogo = (await import('assets/crypto-icons/okb.svg')).default;
          break;
        default:
          localLogo = (await import('assets/crypto-icons/generic.svg')).default;
      }

      importedLogos[symbol] = localLogo;
      return {
        default: localLogo,
      };
    } catch {
      // We need to reload page, because app has been updated
      window.location.reload();
      return {
        default: null,
      };
    }
  });
