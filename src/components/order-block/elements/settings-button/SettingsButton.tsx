import classnames from 'classnames';
import { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, ClickAwayListener, Fade, Paper, Popper } from '@mui/material';
import { Settings } from '@mui/icons-material';

import { TooltipMobile } from 'components/tooltip-mobile/TooltipMobile';

import { SettingsBlock } from '../settings-block/SettingsBlock';

import styles from './SettingsButton.module.scss';

export const SettingsButton = memo(() => {
  const { t } = useTranslation();

  const [isPopperOpen, setPopperOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const handlePopperToggle = useCallback(() => {
    setPopperOpen((prevValue) => !prevValue);
  }, []);

  const handleClose = useCallback(() => {
    setPopperOpen(false);
  }, []);

  return (
    <div className={styles.root}>
      <TooltipMobile tooltip={t('common.settings.title')}>
        <Button
          onClick={handlePopperToggle}
          className={classnames(styles.iconButton, { [styles.active]: isPopperOpen })}
          variant="outlined"
          ref={buttonRef}
        >
          <Settings className={styles.icon} />
        </Button>
      </TooltipMobile>

      <Popper
        sx={{
          zIndex: 1,
        }}
        open={isPopperOpen}
        anchorEl={buttonRef.current}
        placement="bottom-end"
        transition
        disablePortal
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Fade {...TransitionProps} timeout={350}>
              <Paper className={styles.paper}>
                <SettingsBlock />
              </Paper>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </div>
  );
});
