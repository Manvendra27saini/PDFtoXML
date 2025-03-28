import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Conversion } from "@shared/schema";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface FileUploaderProps {
  onConversionStart: () => void;
  onConversionComplete: (conversion: Conversion) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onConversionStart, 
  onConversionComplete 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation<Conversion, Error, File>({
    mutationFn: async (file: File) => {
      try {
        console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);
        
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await fetch("/api/conversions", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!response.ok) {
          console.error(`Upload failed with status: ${response.status}`);
          let errorMessage = "Failed to convert file";
          
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error("Could not parse error response:", e);
          }
          
          throw new Error(errorMessage);
        }
        
        console.log("Upload successful, parsing response...");
        return await response.json();
      } catch (err) {
        console.error("Error in upload mutation:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Conversion completed successfully:", data);
      onConversionComplete(data);
    },
    onError: (error) => {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is PDF
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 20MB",
        variant: "destructive",
      });
      return;
    }

    // Notify parent about conversion start
    onConversionStart();
    
    // Upload file
    uploadMutation.mutate(file);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="mt-6">
      <div 
        className={`drag-area border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition cursor-pointer ${isDragging ? 'active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="space-y-3">
          {uploadMutation.isPending ? (
            <LoadingSpinner size="large" className="mx-auto border-b-2 border-l-2 border-r-2" />
          ) : (
            <i className="ri-upload-cloud-2-line text-5xl text-gray-400"></i>
          )}
          <h3 className="text-lg font-medium text-gray-900">
            {uploadMutation.isPending 
              ? "Uploading your file..."
              : "Drag and drop your PDF file here"}
          </h3>
          {!uploadMutation.isPending && (
            <>
              <p className="text-sm text-gray-500">or</p>
              <div>
                <label htmlFor="fileInput" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                  Browse files
                </label>
                <input 
                  id="fileInput" 
                  ref={fileInputRef}
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleFileInputChange}
                  disabled={uploadMutation.isPending}
                />
              </div>
            </>
          )}
          <p className="text-xs text-gray-500 mt-2">Maximum file size: 20MB</p>
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
