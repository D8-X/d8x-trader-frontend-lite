import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';

import { atom, useAtom } from 'jotai';
import styles from './SearchInput.module.scss';

export const searchFilterAtom = atom<string>('');

export const SearchInput = () => {
  const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom);

  return (
    <div className={styles.searchContainer}>
      <input
        className={styles.searchRaw}
        onChange={(e) => {
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
};
