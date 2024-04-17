import { Button } from '@mui/material';

import styles from './Tabs.module.scss';
import classnames from 'classnames';

interface TabsPropsI {
  options: { label: string; value: number }[];
  currentValue: number;
  setCurrentValue: (currentValue: number) => void;
}

export const Tabs = ({ options, currentValue, setCurrentValue }: TabsPropsI) => {
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <Button
          key={option.value}
          className={classnames({ [styles.selected]: currentValue === option.value })}
          variant="link"
          onClick={() => setCurrentValue(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};
