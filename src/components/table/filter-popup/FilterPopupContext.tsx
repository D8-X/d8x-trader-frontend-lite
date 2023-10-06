import { Dispatch, ReactNode, SetStateAction, createContext, useState } from 'react';

export const FilterPopupContext = createContext<[boolean, Dispatch<SetStateAction<boolean>> | undefined]>([
  false,
  undefined,
]);

export function FilterPopupProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);

  return <FilterPopupContext.Provider value={[isModalOpen, setModalOpen]}>{children}</FilterPopupContext.Provider>;
}
