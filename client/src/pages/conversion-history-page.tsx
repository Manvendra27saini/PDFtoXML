import React, { useState } from "react";
import Layout from "@/components/layout/layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Conversion } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate, formatFileSize } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loading-spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ConversionHistoryPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's conversions
  const { data: conversions = [], isLoading } = useQuery<Conversion[]>({
    queryKey: ["/api/conversions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversions/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversions"] });
      toast({
        title: "Conversion deleted",
        description: "The conversion has been deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this conversion?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = (id: number) => {
    window.location.href = `/api/conversions/${id}/download`;
  };

  const handleView = (id: number) => {
    window.open(`/api/conversions/${id}/download`, '_blank');
  };

  return (
    <Layout>
      <div className="mt-4 md:mt-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Conversion History</h1>

        {isLoading ? (
          <div className="flex justify-center mt-12">
            <LoadingSpinner size="large" />
          </div>
        ) : conversions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <i className="ri-file-list-3-line text-4xl text-gray-400 mb-2"></i>
              <p className="text-gray-600">You haven't converted any files yet</p>
              <Button className="mt-4" onClick={() => window.location.href = '/convert'}>
                Convert a PDF file
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((conversion) => (
                    <TableRow key={conversion.id}>
                      <TableCell className="font-medium">
                        {conversion.originalFilename}
                      </TableCell>
                      <TableCell>{formatDate(conversion.createdAt)}</TableCell>
                      <TableCell>{formatFileSize(conversion.originalSize)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          conversion.status === "completed" 
                            ? "bg-green-100 text-green-800"
                            : conversion.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {conversion.status === "completed" 
                            ? "Complete" 
                            : conversion.status === "failed"
                            ? "Failed"
                            : "Processing"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {conversion.status === "completed" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDownload(conversion.id)}
                              >
                                <i className="ri-download-line mr-1"></i> XML
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleView(conversion.id)}
                              >
                                <i className="ri-eye-line mr-1"></i> View
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(conversion.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <i className="ri-delete-bin-line mr-1"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ConversionHistoryPage;
