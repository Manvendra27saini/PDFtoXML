import React from "react";
import { cn } from "@/lib/utils";

type SpinnerSize = "small" | "medium" | "large";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  small: "h-4 w-4",
  medium: "h-8 w-8",
  large: "h-12 w-12",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "medium", 
  className 
}) => {
  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          "animate-spin rounded-full border-t-2 border-primary",
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
};

export default LoadingSpinner;
