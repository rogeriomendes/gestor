"use client";

import { createContext, useContext, useState } from "react";

interface Company {
  ID: number;
  RAZAO_SOCIAL: string | null;
  NOME_FANTASIA: string | null;
  CNPJ: string | null;
}

interface CompanyContextType {
  selectedCompanyId: number;
  setSelectedCompanyId: (id: number) => void;
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
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
