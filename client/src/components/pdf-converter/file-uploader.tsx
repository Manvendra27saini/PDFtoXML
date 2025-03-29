import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Conversion } from "@shared/schema";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Progress } from "@/components/ui/progress";
import { Upload, FileUp } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface FileUploaderProps {
  onConversionStart: (fileName?: string) => void;
  onConversionComplete: (conversion: Conversion) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onConversionStart, 
  onConversionComplete 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation<Conversion, Error, File>({
    mutationFn: async (file: File) => {
      try {
        console.log(`Uploading file: ${file.name}, size: ${file.size} bytes`);
        setSelectedFile(file);
        
        const formData = new FormData();
        formData.append("file", file);
        
        // Create an XMLHttpRequest to track upload progress
        return await new Promise<Conversion>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
              console.log(`Upload progress: ${percentComplete}%`);
            }
          });
          
          // Handle success
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch (error) {
                reject(new Error("Error parsing response"));
              }
            } else {
              try {
                const errorData = JSON.parse(xhr.responseText);
                reject(new Error(errorData.message || "Upload failed"));
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });
          
          // Handle errors
          xhr.addEventListener("error", () => {
            reject(new Error("Network error occurred"));
          });
          
          xhr.addEventListener("abort", () => {
            reject(new Error("Upload aborted"));
          });
          
          // Open and send the request
          xhr.open("POST", "/api/conversions", true);
          xhr.withCredentials = true;
          xhr.send(formData);
        });
      } catch (err) {
        console.error("Error in upload mutation:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("Conversion completed successfully:", data);
      setUploadProgress(100);
      onConversionComplete(data);
      // Reset file after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
      }, 1000);
    },
    onError: (error) => {
      console.error("Conversion error:", error);
      toast({
        title: "Conversion failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
      setSelectedFile(null);
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
    onConversionStart(file.name);
    
    // Set initial progress
    setUploadProgress(0);
    
    // Upload file
    uploadMutation.mutate(file);
  };

  const handleBrowseClick = () => {
    if (!uploadMutation.isPending) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="mt-6">
      <div 
        className={`drag-area border-2 border-dashed rounded-lg p-8 text-center transition 
          ${isDragging ? 'border-primary bg-blue-50' : 'border-gray-300 hover:bg-gray-50'} 
          ${uploadMutation.isPending ? 'cursor-default' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <div className="space-y-4">
          {uploadMutation.isPending ? (
            <div className="flex flex-col items-center">
              <LoadingSpinner size="large" className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Uploading {selectedFile?.name}
              </h3>
              <div className="w-full max-w-md mx-auto mb-2">
                <Progress value={uploadProgress} className="h-2" />
              </div>
              <p className="text-sm text-gray-500">
                {uploadProgress}% • {formatFileSize(selectedFile?.size || 0)}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 rounded-full p-3 mx-auto w-16 h-16 flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              
              <h3 className="text-xl font-medium text-gray-900">
                Drag and drop your PDF file here
              </h3>
              
              <p className="text-sm text-gray-500">or</p>
              
              <div>
                <button 
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Browse files
                </button>
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
              
              <p className="text-xs text-gray-500">
                Supports PDF files up to 20MB
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
