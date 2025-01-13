import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import { SeparatorTypeE } from './enums';
import { Separator } from './Separator';

import styles from './Separator.module.scss';

interface OrSeparatorPropsI {
  className?: string;
  separatorType?: SeparatorTypeE;
}

export const OrSeparator = ({ className, separatorType }: OrSeparatorPropsI) => {
  const { t } = useTranslation();

  return (
    <div className={classnames(styles.orSeparator, className)}>
      <Separator separatorType={separatorType} />
      <div className={styles.orTextHolder}>
        <span>{t('common.connect-modal.or-separator')}</span>
      </div>
    </div>
  );
};
