import { PageE } from 'types/enums';
import { PageI } from 'types/types';

export const pages: PageI[] = [
  {
    id: 'trade',
    path: PageE.Trade,
    title: 'Trade',
    translationKey: 'navigation.trade',
  },
  {
    id: 'refer',
    path: PageE.Refer,
    title: 'Refer',
    translationKey: 'navigation.refer',
  },
  {
    id: 'vault',
    path: PageE.Vault,
    title: 'Vault',
    translationKey: 'navigation.vault',
  },
];
