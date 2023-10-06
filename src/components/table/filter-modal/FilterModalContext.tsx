import { createContext, Dispatch, ReactNode, SetStateAction, useMemo, useState } from 'react';

export interface FilterPopupContextI {
  isModalOpen: boolean;
  setModalOpen: Dispatch<SetStateAction<boolean>>;
  isFilterApplied: boolean;
  setFilterApplied: Dispatch<SetStateAction<boolean>>;
}

export const FilterModalContext = createContext<FilterPopupContextI>({
  isModalOpen: false,
  setModalOpen: () => {},
  isFilterApplied: false,
  setFilterApplied: () => {},
});

export function FilterPopupProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isFilterApplied, setFilterApplied] = useState(false);

  const contextValue: FilterPopupContextI = useMemo(
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
