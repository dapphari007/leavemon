import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllLeaveCategories, 
  deleteLeaveCategory, 
  initializeDefaultLeaveCategories 
} from "../../services/leaveCategoryService";
import { FaEdit, FaTrash, FaPlus, FaSync } from "react-icons/fa";

export default function LeaveCategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: leaveCategories = [], isLoading } = useQuery({
    queryKey: ["leaveCategories"],
    queryFn: () => getAllLeaveCategories(),
  });

  const initializeDefaultsMutation = useMutation({
    mutationFn: initializeDefaultLeaveCategories,
    onSuccess: () => {
      setSuccess("Default leave categories initialized successfully");
      queryClient.invalidateQueries({ queryKey: ["leaveCategories"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to initialize default categories");
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLeaveCategory,
    onSuccess: () => {
      setSuccess("Leave category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["leaveCategories"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to delete leave category");
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this leave category?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleInitializeDefaults = () => {
    if (window.confirm("This will initialize default leave categories. Are you sure?")) {
      initializeDefaultsMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Leave Categories</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleInitializeDefaults}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            disabled={initializeDefaultsMutation.isPending}
          >
            <FaSync className="mr-2" />
            {initializeDefaultsMutation.isPending ? "Initializing..." : "Initialize Defaults"}
          </button>
          <button
            onClick={() => navigate("/admin/leave-categories/create")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Category
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Default Days Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Approval Levels
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : leaveCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  No leave categories found. Create a new category or initialize defaults.
                </td>
              </tr>
            ) : (
              leaveCategories.map((category: any) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                    {category.isDefault && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.defaultMinDays} - {category.defaultMaxDays} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.maxApprovalLevels}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        category.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin/leave-categories/edit/${category.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleteMutation.isPending}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}