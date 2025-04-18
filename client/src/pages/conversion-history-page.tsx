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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ConversionHistoryPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversionToDelete, setConversionToDelete] = useState<number | null>(null);

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

  const handleDeleteClick = (id: number) => {
    setConversionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (conversionToDelete !== null) {
      deleteMutation.mutate(conversionToDelete);
      setConversionToDelete(null);
    }
    setDeleteDialogOpen(false);
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
              <Button className="mt-4" onClick={() => window.location.href = '/'}>
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
                            onClick={() => handleDeleteClick(conversion.id)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the conversion from your history. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {deleteMutation.isPending ? (
                <LoadingSpinner size="small" className="mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default ConversionHistoryPage;
