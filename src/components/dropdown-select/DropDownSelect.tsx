import { type Dispatch, type PropsWithChildren, type ReactNode, type SetStateAction } from 'react';

import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';
import { Button, Menu, Typography } from '@mui/material';

import styles from './DropDownSelect.module.scss';
import classnames from 'classnames';

interface DropDownSelectPropsI extends PropsWithChildren {
  id: string;
  selectedValue: ReactNode;
  anchorEl: HTMLElement | null;
  setAnchorEl: Dispatch<SetStateAction<HTMLElement | null>>;
  fullWidth?: boolean;
  disabled?: boolean;
}

export const DropDownSelect = ({
  id,
  children,
  selectedValue,
  anchorEl,
  setAnchorEl,
  fullWidth,
  disabled,
}: DropDownSelectPropsI) => {
  const isOpen = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={(event) => setAnchorEl(event.currentTarget)}
        className={classnames(styles.dropDownButton, { [styles.fullWidth]: fullWidth })}
        variant="outlined"
        disabled={disabled}
      >
        <Typography variant="bodyMedium" className={styles.selectedValue}>
          {selectedValue}
        </Typography>
        <div className={classnames(styles.arrowDropDown, { [styles.disabledHandle]: disabled })}>
          {isOpen ? <ArrowDropUp /> : <ArrowDropDown />}
        </div>
      </Button>
      <Menu
        className={styles.menuHolder}
        anchorEl={anchorEl}
        id={id}
        open={isOpen}
        onClose={handleClose}
        onClick={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {children}
      </Menu>
    </>
  );
};
