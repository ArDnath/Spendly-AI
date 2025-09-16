"use client";

import { cn } from "../../lib/utils";
import { RefreshCw } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <RefreshCw className={cn("animate-spin text-gray-400", sizeClasses[size])} />
      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
}

interface LoadingStateProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
}

export function LoadingState({ children, text = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 space-y-4", className)}>
      <LoadingSpinner size="lg" />
      <div className="text-center">
        <p className="text-gray-600 font-medium">{text}</p>
        {children}
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}

export function LoadingOverlay({ isLoading, children, text }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingSpinner size="lg" text={text} />
        </div>
      )}
    </div>
  );
}
