import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ConversionProgressProps {
  fileName: string;
  onCancel: () => void;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({ 
  fileName, 
  onCancel 
}) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Processing");
  
  useEffect(() => {
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prevProgress + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update status text based on progress
    if (progress <= 25) {
      setStatus("Processing");
    } else if (progress <= 50) {
      setStatus("Analyzing document structure");
    } else if (progress <= 75) {
      setStatus("Building XML structure");
    } else {
      setStatus("Finalizing");
    }
  }, [progress]);

  return (
    <div className="mt-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {fileName}
            </h3>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {status}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>{status}...</span>
            <span>{progress}%</span>
          </div>

          <button 
            onClick={onCancel} 
            className="text-sm text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            Cancel
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionProgress;
