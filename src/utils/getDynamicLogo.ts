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
        case 'pendle':
          localLogo = (await import('assets/crypto-icons/pendle.svg')).default;
          break;
        case 'zro':
          localLogo = (await import('assets/crypto-icons/zro.svg')).default;
          break;
        case 'xau':
          localLogo = (await import('assets/crypto-icons/gold.svg')).default;
          break;
        case 'trump24':
          localLogo = (await import('assets/crypto-icons/trump24.svg')).default;
          break;
        case 'chf':
          localLogo = (await import('assets/crypto-icons/chf.svg')).default;
          break;
        case 'wif':
          localLogo = (await import('assets/crypto-icons/wif.svg')).default;
          break;
        case 'pepe':
          localLogo = (await import('assets/crypto-icons/pepe.svg')).default;
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
