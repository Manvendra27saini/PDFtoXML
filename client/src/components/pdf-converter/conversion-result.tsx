import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Conversion } from "@shared/schema";
import { formatFileSize, formatDate } from "@/lib/utils";

interface ConversionResultProps {
  conversion: Conversion;
  onConvertAnother: () => void;
}

const ConversionResult: React.FC<ConversionResultProps> = ({ 
  conversion, 
  onConvertAnother 
}) => {
  const handleDownload = () => {
    window.location.href = `/api/conversions/${conversion.id}/download`;
  };

  const formatProcessingTime = (metadata: any) => {
    if (!metadata || !metadata.processingTimeMs) return "N/A";
    const seconds = (metadata.processingTimeMs / 1000).toFixed(1);
    return `${seconds} seconds`;
  };

  // Format structure accuracy as percentage
  const formatAccuracy = (metadata: any) => {
    if (!metadata || !metadata.structureAccuracy) return "N/A";
    return `${(metadata.structureAccuracy * 100).toFixed(0)}% accurate`;
  };

  return (
    <div className="mt-8">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <i className="ri-file-text-line text-3xl text-green-500 mr-3"></i>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{conversion.originalFilename}</h3>
                  <div className="flex mt-1">
                    <span className="text-sm text-gray-500 mr-3">
                      Original: {formatFileSize(conversion.originalSize)}
                    </span>
                    {conversion.convertedSize && (
                      <span className="text-sm text-gray-500">
                        Converted: {formatFileSize(conversion.convertedSize)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                  Converted
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleDownload}>
                <i className="ri-download-line mr-2"></i> Download XML
              </Button>
              <Button variant="outline" onClick={onConvertAnother}>
                <i className="ri-add-line mr-2"></i> Convert Another File
              </Button>
              <Button variant="outline">
                <i className="ri-save-line mr-2"></i> Save to Library
              </Button>
            </div>
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <div className="bg-gray-50 p-1 border-b">
              <TabsList className="bg-transparent border-b">
                <TabsTrigger 
                  value="preview"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Preview
                </TabsTrigger>
                <TabsTrigger 
                  value="details"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Details
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="p-6 max-h-96 overflow-auto">
              <div className="bg-gray-50 p-4 rounded border border-gray-200 xml-content text-gray-800">
                <code>{conversion.xmlContent}</code>
              </div>
            </TabsContent>

            <TabsContent value="details" className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Conversion Details</h4>
                  <ul className="mt-2 space-y-2">
                    <li className="flex justify-between">
                      <span className="text-sm text-gray-600">Conversion Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(conversion.createdAt)}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-sm text-gray-600">Processing Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatProcessingTime(conversion.metadata)}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-sm text-gray-600">Structure Preservation</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatAccuracy(conversion.metadata)}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-sm text-gray-600">Pages Processed</span>
                      <span className="text-sm font-medium text-gray-900">
                        {conversion.metadata?.pageCount || "N/A"}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-sm text-gray-600">XML Schema</span>
                      <span className="text-sm font-medium text-gray-900">
                        Custom Document Format
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionResult;
