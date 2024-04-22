import { ComponentType, lazy, LazyExoticComponent, ReactComponentElement, ReactNode } from 'react';

import { TemporaryAnyT } from 'types/types';

const importedLogos: Record<string, ReactComponentElement<TemporaryAnyT>> = {};

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
      const localLogo = (await import(/* @vite-ignore */ `assets/crypto-icons/${symbol}.svg`)).default;
      importedLogos[symbol] = localLogo;
      return {
        default: localLogo,
      };
    } catch {
      const defaultLogo = (await import(`../../node_modules/cryptocurrency-icons/svg/color/generic.svg`))
        .default as TemporaryAnyT;
      importedLogos[symbol] = defaultLogo;
      return {
        default: defaultLogo,
      };
    }
  });
