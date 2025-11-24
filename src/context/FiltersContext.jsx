import React, { createContext, useContext, useState } from 'react';
import { DEFAULT_FILTERS } from '../lib/filterUtil';

const FiltersContext = createContext(null);

export const FiltersProvider = ({ children }) => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  return (
    <FiltersContext.Provider value={{ filters, setFilters }}>
      {children}
    </FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const ctx = useContext(FiltersContext);
  if (!ctx) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return ctx;
};

export default FiltersContext;
