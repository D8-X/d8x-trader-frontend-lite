import { RoutesE } from './RoutesE';

export interface PageI {
  id: string;
  path: RoutesE | string;
  translationKey: string;
}

export const pages: PageI[] = [
  {
    id: 'trade',
    path: RoutesE.Trade,
    translationKey: 'navigation.trade',
  },
  {
    id: 'refer',
    path: RoutesE.Refer,
    translationKey: 'navigation.refer',
  },
  {
    id: 'vault',
    path: RoutesE.Vault,
    translationKey: 'navigation.vault',
  },
];

export const authPages: PageI[] = [
  {
    id: 'portfolio',
    path: RoutesE.Portfolio,
    translationKey: 'navigation.portfolio',
  },
];
