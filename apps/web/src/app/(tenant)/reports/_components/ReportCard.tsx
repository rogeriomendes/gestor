"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReportConfig } from "../_lib/reportRegistry";

interface ReportCardProps {
  report: ReportConfig;
  className?: string;
}

export function ReportCard({ report, className }: ReportCardProps) {
  const Icon = report.icon;

  return (
    <Link href={`/reports/${report.id}`}>
      <Card
        className={cn(
          "group h-full cursor-pointer transition-all duration-200 hover:shadow-lg",
          "rounded-md hover:border-primary/50",
          className
        )}
      >
        <CardHeader>
          <CardTitle className="transition-colors group-hover:text-primary">
            <div className="flex flex-row items-center justify-between">
              <div
                className="flex flex-row items-center gap-3"
                style={{
                  backgroundColor: report.color
                    ? `${report.color}15`
                    : "hsl(var(--muted))",
                }}
              >
                <Icon
                  className="h-6 w-6"
                  style={{
                    color: report.color || "hsl(var(--foreground))",
                  }}
                />
                {report.title}
              </div>
              <Badge className="text-xs" variant="outline">
                {report.categoryName}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="mt-2">
            {report.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground text-sm transition-colors group-hover:text-primary">
            Ver relatório
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
