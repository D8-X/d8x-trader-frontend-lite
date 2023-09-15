import styles from './Tabs.module.scss';

interface TabsPropsI {
  options: { label: string; value: number }[];
  currentValue: number;
  setCurrentValue: (currentValue: number) => void;
}

export const Tabs = ({ options, currentValue, setCurrentValue }: TabsPropsI) => {
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <div
          key={option.value}
          className={currentValue === option.value ? styles.active : styles.inactive}
          onClick={() => setCurrentValue(option.value)}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};
