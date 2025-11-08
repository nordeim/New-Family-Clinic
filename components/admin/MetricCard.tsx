// components/admin/MetricCard.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";
import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string; // e.g., "+5.2%" or "-1.8%"
  icon: React.ElementType;
}

export function MetricCard({ title, value, change, icon: Icon }: MetricCardProps) {
  const isPositive = change && change.startsWith("+");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-neutral-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs text-neutral-500 flex items-center",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
            {change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
