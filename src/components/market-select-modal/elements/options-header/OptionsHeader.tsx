import { CollateralSelect } from '../collateral-select/CollateralSelect';
import { SearchInput } from '../search-input/SearchInput';
import { Filters } from '../filters/Filters';

import styles from './OptionsHeader.module.scss';

export const OptionsHeader = () => (
  <div className={styles.controlsContainer}>
    <div className={styles.searchAndType}>
      <SearchInput />
      <CollateralSelect />
    </div>
    <Filters />
  </div>
);
