import { atom, useAtom } from 'jotai';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

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
      <SearchIcon className={styles.searchIcon} style={{ color: 'var(--d8x-color-icon)' }} />
      {searchFilter && <ClearIcon className={styles.closeIcon} onClick={() => setSearchFilter('')} />}
    </div>
  );
});
