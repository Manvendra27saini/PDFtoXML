import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Conversion } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface RecentConversionsProps {
  conversions: Conversion[];
  isLoading: boolean;
}

const RecentConversions: React.FC<RecentConversionsProps> = ({ 
  conversions,
  isLoading 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    // This would usually navigate to a detailed view page
    window.open(`/api/conversions/${id}/download`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900">Recent Conversions</h2>
        <div className="mt-8 flex justify-center">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold text-gray-900">Recent Conversions</h2>
      
      {conversions.length === 0 ? (
        <div className="mt-4 bg-white shadow rounded-lg p-6 text-center">
          <i className="ri-file-list-3-line text-4xl text-gray-400 mb-2"></i>
          <p className="text-gray-600">You haven't converted any files yet</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {conversions.slice(0, 3).map((conversion) => (
            <Card key={conversion.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <i className="ri-file-text-line text-2xl text-gray-400"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversion.originalFilename}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Converted on {formatDate(conversion.createdAt)}
                      </p>
                    </div>
                  </div>
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
                </div>
                
                <div className="mt-4 flex space-x-2">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {conversions.length > 3 && (
        <div className="mt-4 text-center">
          <Link href="/history">
            <a className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary hover:text-blue-700">
              View all conversions
              <i className="ri-arrow-right-line ml-1"></i>
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RecentConversions;
