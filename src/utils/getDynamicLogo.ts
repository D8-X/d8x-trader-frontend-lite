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
        case 'chf':
          localLogo = (await import('assets/crypto-icons/chf.svg')).default;
          break;
        case 'wif':
          localLogo = (await import('assets/crypto-icons/wif.svg')).default;
          break;
        case 'pepe':
          localLogo = (await import('assets/crypto-icons/pepe.svg')).default;
          break;
        case 'btlj':
          localLogo = (await import('assets/crypto-icons/btlj.svg')).default;
          break;
        case 'shib':
          localLogo = (await import('assets/crypto-icons/shib.svg')).default;
          break;
        case 'ton':
          localLogo = (await import('assets/crypto-icons/ton.svg')).default;
          break;
        case 'harris24p':
          localLogo = (await import('assets/crypto-icons/harris.svg')).default;
          break;
        case 'supbwl49':
          localLogo = (await import('assets/crypto-icons/49ers.svg')).default;
          break;
        case 'insout2':
          localLogo = (await import('assets/crypto-icons/insideout.svg')).default;
          break;
        case 'pol':
          localLogo = (await import('assets/crypto-icons/pol.svg')).default;
          break;
        case 'dirac':
          localLogo = (await import('assets/crypto-icons/dirac.svg')).default;
          break;
        case 'buds':
          localLogo = (await import('assets/crypto-icons/buds.svg')).default;
          break;
        case 'beartic':
          localLogo = (await import('assets/crypto-icons/beartic.svg')).default;
          break;
        case 'bdeg':
          localLogo = (await import('assets/crypto-icons/bdeg.svg')).default;
          break;
        case 'honey':
          localLogo = (await import('assets/crypto-icons/honey.svg')).default;
          break;
        case 'ibgt':
          localLogo = (await import('assets/crypto-icons/ibgt.svg')).default;
          break;
        case 'trmpukr':
          localLogo = (await import('assets/crypto-icons/trmpukr.svg')).default;
          break;
        case 'btcnov90':
          localLogo = (await import('assets/crypto-icons/btc90k.svg')).default;
          break;
        case 'btc24100':
          localLogo = (await import('assets/crypto-icons/btc100k.svg')).default;
          break;
        case 'mclaren24':
          localLogo = (await import('assets/crypto-icons/mclaren.svg')).default;
          break;
        case 'mancity':
          localLogo = (await import('assets/crypto-icons/mancity.svg')).default;
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
