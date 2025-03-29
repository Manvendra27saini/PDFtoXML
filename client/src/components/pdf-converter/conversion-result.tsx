import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Conversion } from "@shared/schema";
import { formatFileSize, formatDate } from "@/lib/utils";
import { FileText, Plus, Save, AlertCircle } from "lucide-react";
import DocumentViewer from "./document-viewer";
import { useToast } from "@/hooks/use-toast";

interface ConversionResultProps {
  conversion: Conversion;
  onConvertAnother: () => void;
}

const ConversionResult: React.FC<ConversionResultProps> = ({ 
  conversion, 
  onConvertAnother 
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("preview");
  
  const handleDownload = () => {
    if (!conversion.xmlContent) {
      toast({
        title: "Download failed",
        description: "No XML content available to download",
        variant: "destructive",
      });
      return;
    }
    
    // Create a Blob from the XML content
    const blob = new Blob([conversion.xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const filename = conversion.originalFilename.replace(/\.[^/.]+$/, "") + ".xml";
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatProcessingTime = () => {
    if (!metadata || !metadata.processingTimeMs) return "N/A";
    const seconds = (metadata.processingTimeMs / 1000).toFixed(1);
    return `${seconds} seconds`;
  };

  // Define the metadata types
  type ConversionMetadata = {
    pageCount: number;
    processingTimeMs: number;
    structureAccuracy: number;
    structures: {
      paragraphs: number;
      tables: number;
      lists: number;
      images: number;
    };
  };

  // Parse the metadata properly
  const getTypedMetadata = (): ConversionMetadata | null => {
    if (!conversion.metadata) return null;
    
    try {
      // If metadata is already an object with the right structure, use it
      if (typeof conversion.metadata === 'object') {
        return conversion.metadata as ConversionMetadata;
      }
      
      // If it's a string (JSON), parse it
      if (typeof conversion.metadata === 'string') {
        return JSON.parse(conversion.metadata) as ConversionMetadata;
      }
    } catch (e) {
      console.error("Error parsing metadata", e);
    }
    
    return null;
  };
  
  const metadata = getTypedMetadata();
  
  // Format structure accuracy as percentage
  const formatAccuracy = () => {
    if (!metadata || !metadata.structureAccuracy) return "N/A";
    return `${(metadata.structureAccuracy * 100).toFixed(0)}% accurate`;
  };

  // Format detected structures
  const formatStructures = () => {
    if (!metadata || !metadata.structures) return null;
    
    const { paragraphs, tables, lists, images } = metadata.structures;
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-blue-50 p-3 rounded-lg flex flex-col items-center">
          <span className="text-xl font-bold text-blue-600">{paragraphs}</span>
          <span className="text-sm text-blue-800">Paragraphs</span>
        </div>
        <div className="bg-green-50 p-3 rounded-lg flex flex-col items-center">
          <span className="text-xl font-bold text-green-600">{tables}</span>
          <span className="text-sm text-green-800">Tables</span>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg flex flex-col items-center">
          <span className="text-xl font-bold text-yellow-600">{lists}</span>
          <span className="text-sm text-yellow-800">Lists</span>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg flex flex-col items-center">
          <span className="text-xl font-bold text-purple-600">{images}</span>
          <span className="text-sm text-purple-800">Images</span>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
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
                Download XML
              </Button>
              <Button variant="outline" onClick={onConvertAnother}>
                <Plus className="h-4 w-4 mr-2" /> Convert Another File
              </Button>
              <Button variant="outline" disabled>
                <Save className="h-4 w-4 mr-2" /> Save to Library
              </Button>
            </div>
          </div>

          <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab} className="w-full">
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

            <TabsContent value="preview" className="p-0">
              <DocumentViewer conversion={conversion} />
            </TabsContent>

            <TabsContent value="details" className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Conversion Details</h4>
                  <ul className="mt-2 space-y-3 divide-y divide-gray-100">
                    <li className="flex justify-between pt-2">
                      <span className="text-sm text-gray-600">Conversion Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatDate(conversion.createdAt)}
                      </span>
                    </li>
                    <li className="flex justify-between pt-2">
                      <span className="text-sm text-gray-600">Processing Time</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatProcessingTime()}
                      </span>
                    </li>
                    <li className="flex justify-between pt-2">
                      <span className="text-sm text-gray-600">Structure Preservation</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatAccuracy()}
                      </span>
                    </li>
                    <li className="flex justify-between pt-2">
                      <span className="text-sm text-gray-600">Pages Processed</span>
                      <span className="text-sm font-medium text-gray-900">
                        {metadata?.pageCount || "N/A"}
                      </span>
                    </li>
                    <li className="flex justify-between pt-2">
                      <span className="text-sm text-gray-600">XML Schema</span>
                      <span className="text-sm font-medium text-gray-900">
                        Custom Document Format
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Detected Structures</h4>
                  {formatStructures()}
                </div>
                
                {metadata && metadata.structureAccuracy < 0.85 && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-amber-800">Structure Detection Note</h5>
                      <p className="text-sm text-amber-700 mt-1">
                        Some document structures may not have been detected with high confidence. 
                        The conversion preserves text content but advanced formatting might require manual adjustment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionResult;
