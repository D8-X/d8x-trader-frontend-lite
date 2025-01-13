import classnames from 'classnames';
import { type ReactNode } from 'react';

import { MenuItem } from '@mui/material';

import styles from './ButtonMenuItem.module.scss';

export interface ButtonMenuItemPropsI {
  option: ReactNode;
  isActive: boolean;
  onClick: () => void;
}

export const ButtonMenuItem = ({ option, isActive, onClick }: ButtonMenuItemPropsI) => (
  <MenuItem onClick={onClick} className={classnames(styles.menuItem, { [styles.selected]: isActive })}>
    {option}
  </MenuItem>
);
