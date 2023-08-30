import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';

import styles from './SearchInput.module.scss';

export const SearchInput = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className={styles.searchContainer}>
      <input
        className={styles.searchRaw}
        onChange={(e) => {
          setInputValue(e.target.value);
        }}
        placeholder="Search..."
        value={inputValue}
      />
      <SearchIcon className={styles.searchIcon} style={{ color: 'var(--d8x-icon-color)' }} />
      {inputValue && <ClearIcon className={styles.closeIcon} onClick={() => setInputValue('')} />}
    </div>
  );
};
