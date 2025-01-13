import classnames from 'classnames';

import styles from './ToggleButton.module.scss';

interface ToggleButtonPropsI {
  isActive: boolean;
  onClick?: () => void;
}

export const ToggleButton = ({ isActive, onClick }: ToggleButtonPropsI) => {
  return (
    <div className={classnames(styles.root, { [styles.active]: isActive })} onClick={onClick}>
      <div className={styles.handle}></div>
    </div>
  );
};
