import { atom } from 'jotai';

export const leverageAtom = atom(1);
export const inputValueAtom = atom('1');
export const setLeverageAtom = atom(null, (_get, set, value: number) => {
  let leverage = 1;
  let inputValue = '';
  if (value) {
    const valueToSet = value < 1 ? 1 : value;
    leverage = valueToSet;
    inputValue = String(valueToSet);
  }

  set(leverageAtom, leverage);
  set(inputValueAtom, inputValue);
});
