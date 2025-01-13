import { atom, useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Clear, Search } from '@mui/icons-material';

import styles from './SearchInput.module.scss';

export const searchFilterAtom = atom<string>('');

export const SearchInput = memo(() => {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);
  const { t } = useTranslation();

  return (
    <div className={styles.searchContainer}>
      <input
        className={styles.searchRaw}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSearchFilter(e.target.value);
        }}
        placeholder={t('common.select.search')}
        value={searchFilter}
      />
      <Search className={styles.searchIcon} style={{ color: 'var(--d8x-color-text-label-one)' }} />
      {searchFilter && <Clear className={styles.closeIcon} onClick={() => setSearchFilter('')} />}
    </div>
  );
});
