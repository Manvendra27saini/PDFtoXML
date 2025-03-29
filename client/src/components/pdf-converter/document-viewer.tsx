import React, { useState } from 'react';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Conversion } from "@shared/schema";
import { ChevronLeft, ChevronRight, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/utils";

interface DocumentViewerProps {
  conversion: Conversion;
}

interface XMLPage {
  pageNumber: number;
  content: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ conversion }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("xml");
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Parse XML content to extract pages
  const parseXMLPages = (): XMLPage[] => {
    try {
      if (!conversion.xmlContent) {
        return [{ pageNumber: 1, content: "No XML content available" }];
      }
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(conversion.xmlContent, "text/xml");
      
      // Get all page sections
      const pageSections = xmlDoc.querySelectorAll("section[id^='page-']");
      
      if (pageSections.length === 0) {
        // If no pages found, return entire XML as a single page
        return [{ pageNumber: 1, content: conversion.xmlContent }];
      }
      
      return Array.from(pageSections).map((section, index) => {
        const pageNumber = index + 1;
        const xmlSerializer = new XMLSerializer();
        const content = xmlSerializer.serializeToString(section);
        return {
          pageNumber,
          content: prettifyXML(content)
        };
      });
    } catch (error) {
      console.error("Error parsing XML:", error);
      // Return whole document as a single page if parsing fails
      return [{ 
        pageNumber: 1, 
        content: conversion.xmlContent || "Error parsing XML content"
      }];
    }
  };
  
  // Format XML with proper indentation
  const prettifyXML = (xml: string): string => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, "text/xml");
      const xsltDoc = parser.parseFromString([
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">',
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
      ].join('\n'), 'application/xml');

      const xsltProcessor = new XSLTProcessor();    
      xsltProcessor.importStylesheet(xsltDoc);
      const resultDoc = xsltProcessor.transformToDocument(xmlDoc);
      const serializer = new XMLSerializer();
      return serializer.serializeToString(resultDoc);
    } catch (error) {
      console.error("Error prettifying XML:", error);
      return xml;
    }
  };
  
  const xmlPages = parseXMLPages();
  const totalPages = xmlPages.length;
  
  // Handle page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Handle copying content
  const copyToClipboard = () => {
    try {
      const content = activeTab === "xml" 
        ? xmlPages[currentPage - 1]?.content || "No content available"
        : conversion.originalFilename;
        
      navigator.clipboard.writeText(content);
      
      toast({
        title: "Copied!",
        description: "Content copied to clipboard",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy content to clipboard",
        variant: "destructive",
      });
    }
  };
  
  // Handle XML download
  const downloadXML = () => {
    if (!conversion.xmlContent) {
      toast({
        title: "Download failed",
        description: "No XML content available to download",
        variant: "destructive",
      });
      return;
    }
    
    const filename = conversion.originalFilename.replace(/\.[^/.]+$/, "") + ".xml";
    const blob = new Blob([conversion.xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: `Downloading ${filename}`,
      variant: "default",
    });
  };
  
  return (
    <Card className="w-full overflow-hidden">
      <Tabs defaultValue="xml" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center p-4 border-b">
          <TabsList>
            <TabsTrigger value="xml">XML Output</TabsTrigger>
            <TabsTrigger value="original">Original PDF</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={downloadXML} disabled={!conversion.xmlContent}>
              <Download className="h-4 w-4 mr-2" />
              Download XML
            </Button>
          </div>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="xml" className="m-0">
            <div className="bg-gray-50 p-1">
              <div className="flex justify-between items-center p-2 bg-white border-b">
                <div className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="bg-white rounded shadow-sm my-2 p-4 font-mono text-sm overflow-auto max-h-[600px]">
                <pre className="whitespace-pre-wrap">{xmlPages[currentPage - 1]?.content || 'No content available'}</pre>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="original" className="m-0">
            <div className="bg-gray-50 p-4 min-h-[300px] flex flex-col items-center justify-center">
              <p className="text-gray-500 mb-2">Original PDF preview not available</p>
              <p className="text-sm text-gray-400">Filename: {conversion.originalFilename}</p>
              <p className="text-sm text-gray-400 mt-2">
                File size: {formatFileSize(conversion.originalSize)}
              </p>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default DocumentViewer;