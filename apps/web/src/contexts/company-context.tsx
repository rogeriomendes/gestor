"use client";

import { createContext, useContext, useState } from "react";

interface Company {
  CNPJ: string | null;
  ID: number;
  NOME_FANTASIA: string | null;
  RAZAO_SOCIAL: string | null;
}

interface CompanyContextType {
  selectedCompany: Company | null;
  selectedCompanyId: number;
  setSelectedCompany: (company: Company | null) => void;
  setSelectedCompanyId: (id: number) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(0); // 0 = "Todas as empresas"
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  return (
    <CompanyContext.Provider
      value={{
        selectedCompanyId,
        setSelectedCompanyId,
        selectedCompany,
        setSelectedCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}
