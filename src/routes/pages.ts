import { type FC, SVGProps } from 'react';

import D8XLogo from 'assets/logos/d8xLogo.svg?react';

import { RoutesE } from './RoutesE';
import { pagesConfig } from '../config';

export interface PageI {
  id: string;
  path: RoutesE | string;
  IconComponent?: FC<SVGProps<SVGSVGElement> & { className?: string | undefined }>;
  translationKey: string;
  enabled: boolean;
  enabledByChains?: number[];
}

export const pages: PageI[] = [
  {
    id: 'trade',
    path: RoutesE.Trade,
    translationKey: 'navigation.trade',
    enabled: true,
  },
  {
    id: 'boost-station',
    IconComponent: D8XLogo,
    path: RoutesE.BoostStation,
    translationKey: 'navigation.boost-station',
    enabled: pagesConfig.enabledBoostStationPage,
  },
  {
    id: 'refer',
    path: RoutesE.Refer,
    translationKey: 'navigation.refer',
    enabled: pagesConfig.enabledReferPage,
  },
  {
    id: 'vault',
    path: RoutesE.Vault,
    translationKey: 'navigation.vault',
    enabled: pagesConfig.enabledVaultPage,
  },
];

export const authPages: PageI[] = [
  {
    id: 'strategies',
    path: RoutesE.Strategies,
    translationKey: 'navigation.strategies',
    enabled: pagesConfig.enabledStrategiesPage,
    enabledByChains: pagesConfig.enabledStrategiesPageByChains,
  },
  {
    id: 'portfolio',
    path: RoutesE.Portfolio,
    translationKey: 'navigation.portfolio',
    enabled: pagesConfig.enabledPortfolioPage,
  },
];
