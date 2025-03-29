import React, { useState } from "react";
import Layout from "@/components/layout/layout";
import FileUploader from "@/components/pdf-converter/file-uploader";
import ConversionProgress from "@/components/pdf-converter/conversion-progress";
import ConversionResult from "@/components/pdf-converter/conversion-result";
import RecentConversions from "@/components/pdf-converter/recent-conversions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Conversion } from "@shared/schema";

enum ConversionStage {
  UPLOAD,
  PROCESSING,
  COMPLETED
}

const HomePage: React.FC = () => {
  const [conversionStage, setConversionStage] = useState<ConversionStage>(ConversionStage.UPLOAD);
  const [currentFile, setCurrentFile] = useState<string>("");
  const [currentConversion, setCurrentConversion] = useState<Conversion | null>(null);
  const queryClient = useQueryClient();

  // Fetch user's conversions
  const { data: conversions = [], isLoading } = useQuery<Conversion[]>({
    queryKey: ["/api/conversions"],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            console.log("Not authenticated, returning empty array");
            return [];
          }
          throw new Error(`API error: ${res.status}`);
        }
        
        return await res.json();
      } catch (error) {
        console.error("Error fetching conversions:", error);
        return [];
      }
    },
  });

  const handleConversionStart = (fileName?: string) => {
    if (fileName) {
      setCurrentFile(fileName);
    }
    setConversionStage(ConversionStage.PROCESSING);
  };

  const handleConversionComplete = (conversion: Conversion) => {
    setCurrentConversion(conversion);
    setConversionStage(ConversionStage.COMPLETED);
    queryClient.invalidateQueries({ queryKey: ["/api/conversions"] });
  };

  const handleCancel = () => {
    setConversionStage(ConversionStage.UPLOAD);
  };

  const handleConvertAnother = () => {
    setConversionStage(ConversionStage.UPLOAD);
    setCurrentConversion(null);
  };

  return (
    <Layout>
      <div className="mt-4 md:mt-0">
        <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Convert PDF to XML</h1>
        <p className="mt-2 text-sm text-gray-600 hidden md:block">
          Upload your PDF documents to convert them to XML format. The structure and formatting will be preserved.
        </p>

        {conversionStage === ConversionStage.UPLOAD && (
          <FileUploader 
            onConversionStart={handleConversionStart}
            onConversionComplete={handleConversionComplete}
          />
        )}

        {conversionStage === ConversionStage.PROCESSING && (
          <ConversionProgress 
            fileName={currentFile || "Document.pdf"}
            onCancel={handleCancel}
          />
        )}

        {conversionStage === ConversionStage.COMPLETED && currentConversion && (
          <ConversionResult 
            conversion={currentConversion}
            onConvertAnother={handleConvertAnother}
          />
        )}

        <RecentConversions conversions={conversions} isLoading={isLoading} />
      </div>
    </Layout>
  );
};

export default HomePage;
