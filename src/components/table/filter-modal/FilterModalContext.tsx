import { createContext, Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react';

export interface FilterModalContextI {
  isModalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  isFilterApplied: boolean;
  setFilterApplied: Dispatch<SetStateAction<boolean>>;
}

export const FilterModalContext = createContext<FilterModalContextI>({
  isModalOpen: false,
  setModalOpen: () => {},
  isFilterApplied: false,
  setFilterApplied: () => {},
});

export function FilterModalProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isFilterApplied, setFilterApplied] = useState(false);

  const contextValue: FilterModalContextI = useMemo(
    () => ({
      isModalOpen,
      setModalOpen,
      isFilterApplied,
      setFilterApplied,
    }),
    [isModalOpen, isFilterApplied]
  );

  return <FilterModalContext.Provider value={contextValue}>{children}</FilterModalContext.Provider>;
}
