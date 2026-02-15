"use client";

import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportsErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ReportsErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ReportsErrorBoundary extends React.Component<
  ReportsErrorBoundaryProps,
  ReportsErrorBoundaryState
> {
  constructor(props: ReportsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ReportsErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Erro capturado no ReportsErrorBoundary:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full rounded-md" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangleIcon className="mr-2 h-5 w-5" />
              Erro ao Carregar Relatórios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado ao carregar os relatórios. Isso pode
              ser causado por:
            </p>
            <ul className="list-inside list-disc space-y-1 text-muted-foreground text-sm">
              <li>Problemas de conexão com o banco de dados</li>
              <li>Dados corrompidos ou inválidos</li>
              <li>Erro na consulta de dados</li>
            </ul>
            {this.state.error && (
              <details className="text-muted-foreground text-xs">
                <summary className="cursor-pointer">Detalhes do erro</summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
              >
                Recarregar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
