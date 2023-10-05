import classnames from 'classnames';

import { MenuItem } from '@mui/material';

import styles from './DropDownMenuItem.module.scss';

export interface DropDownMenuItemPropsI {
  option: string;
  isActive: boolean;
  onClick: () => void;
}

export const DropDownMenuItem = ({ option, isActive, onClick }: DropDownMenuItemPropsI) => (
  <MenuItem onClick={onClick} className={classnames(styles.menuItem, { [styles.selected]: isActive })}>
    {option}
  </MenuItem>
);
