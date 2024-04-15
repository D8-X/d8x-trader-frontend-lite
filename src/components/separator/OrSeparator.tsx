import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import { Separator } from './Separator';

import styles from './Separator.module.scss';

interface OrSeparatorPropsI {
  className?: string;
}

export const OrSeparator = ({ className }: OrSeparatorPropsI) => {
  const { t } = useTranslation();

  return (
    <div className={classnames(styles.orSeparator, className)}>
      <Separator />
      <div className={styles.orTextHolder}>
        <span>{t('common.connect-modal.or-separator')}</span>
      </div>
    </div>
  );
};
