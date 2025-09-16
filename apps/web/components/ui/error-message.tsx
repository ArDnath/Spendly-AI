"use client";

import { AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { cn } from "../../lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: "error" | "warning";
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function ErrorMessage({ 
  title, 
  message, 
  type = "error", 
  onRetry, 
  className,
  showIcon = true 
}: ErrorMessageProps) {
  const Icon = type === "error" ? XCircle : AlertTriangle;
  const colorClasses = type === "error" 
    ? "border-red-200 bg-red-50 text-red-800" 
    : "border-yellow-200 bg-yellow-50 text-yellow-800";

  return (
    <Card className={cn(colorClasses, className)}>
      <CardHeader className="pb-3">
        {title && (
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            {showIcon && <Icon className="w-4 h-4" />}
            {title}
          </CardTitle>
        )}
        <CardDescription className={type === "error" ? "text-red-600" : "text-yellow-600"}>
          {message}
        </CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent className="pt-0">
          <Button 
            onClick={onRetry} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Try again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-red-600", className)}>
      <XCircle className="w-4 h-4" />
      <span>{message}</span>
    </div>
  );
}
