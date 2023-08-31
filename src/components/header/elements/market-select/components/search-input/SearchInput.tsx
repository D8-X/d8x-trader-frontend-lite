import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

import { atom, useAtom } from 'jotai';
import styles from './SearchInput.module.scss';
import { memo } from 'react';

export const searchFilterAtom = atom<string>('');

export const SearchInput = memo(() => {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);

  return (
    <div className={styles.searchContainer}>
      <input
        className={styles.searchRaw}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSearchFilter(e.target.value);
        }}
        placeholder="Search..."
        value={searchFilter}
      />
      <SearchIcon className={styles.searchIcon} style={{ color: 'var(--d8x-icon-color)' }} />
      {searchFilter && <ClearIcon className={styles.closeIcon} onClick={() => setSearchFilter('')} />}
    </div>
  );
});
