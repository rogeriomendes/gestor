"use client";

import { DownloadIcon, FileIcon, TableIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportExporterProps {
  data: any[];
  filename: string;
  onExport: (format: string, data: any[]) => void;
}

export function ReportExporter({
  data,
  filename,
  onExport,
}: ReportExporterProps) {
  const [exportFormat, setExportFormat] = useState("csv");

  const exportToCSV = (data: any[]) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escapar aspas e vírgulas
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[]) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (data: any[]) => {
    // Para exportar para Excel, você precisaria de uma biblioteca como xlsx
    // Por enquanto, vamos exportar como CSV com extensão .xlsx
    exportToCSV(data);
  };

  const handleExportClick = () => {
    switch (exportFormat) {
      case "csv":
        exportToCSV(data);
        break;
      case "json":
        exportToJSON(data);
        break;
      case "excel":
        exportToExcel(data);
        break;
      default:
        exportToCSV(data);
    }
    onExport(exportFormat, data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <DownloadIcon className="mr-2 h-5 w-5" />
          Exportar Relatório
        </CardTitle>
        <CardDescription>
          Exporte os dados do relatório em diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="font-medium text-sm">Formato de Exportação</label>
          <Select onValueChange={setExportFormat} value={exportFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center">
                  <TableIcon className="mr-2 h-4 w-4" />
                  CSV (Excel)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center">
                  <FileIcon className="mr-2 h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center">
                  <FileIcon className="mr-2 h-4 w-4" />
                  Excel (.xlsx)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-muted-foreground text-sm">
          <p>
            Registros para exportar: <strong>{data.length}</strong>
          </p>
          <p>
            Arquivo:{" "}
            <strong>
              {filename}.{exportFormat}
            </strong>
          </p>
        </div>

        <Button className="w-full" onClick={handleExportClick}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Exportar {data.length} registros
        </Button>
      </CardContent>
    </Card>
  );
}

// Hook para usar o exportador
export function useReportExporter() {
  const [isExporting, setIsExporting] = useState(false);

  const exportData = async (format: string, data: any[], filename: string) => {
    setIsExporting(true);
    try {
      // Simular delay de processamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Aqui você pode adicionar lógica adicional de processamento
      console.log(`Exportando ${data.length} registros em formato ${format}`);
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
  };
}
