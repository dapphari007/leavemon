import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getLeaveCategoryById, updateLeaveCategory } from "../../services/leaveCategoryService";

type FormValues = {
  name: string;
  description: string;
  defaultMinDays: number;
  defaultMaxDays: number;
  maxApprovalLevels: number;
  isActive: boolean;
  isDefault: boolean;
};

export default function EditLeaveCategoryPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);

  const { data: leaveCategory, isLoading } = useQuery({
    queryKey: ["leaveCategory", id],
    queryFn: () => getLeaveCategoryById(id!),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      defaultMinDays: 0.5,
      defaultMaxDays: 2,
      maxApprovalLevels: 3,
      isActive: true,
      isDefault: false,
    },
  });

  useEffect(() => {
    if (leaveCategory) {
      reset({
        name: leaveCategory.name,
        description: leaveCategory.description,
        defaultMinDays: leaveCategory.defaultMinDays,
        defaultMaxDays: leaveCategory.defaultMaxDays,
        maxApprovalLevels: leaveCategory.maxApprovalLevels,
        isActive: leaveCategory.isActive,
        isDefault: leaveCategory.isDefault,
      });
    }
  }, [leaveCategory, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => updateLeaveCategory(id!, data),
    onSuccess: () => {
      navigate("/admin/leave-categories");
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message || "Failed to update leave category"
      );
    },
  });

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!leaveCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        Leave category not found. <a href="/admin/leave-categories" className="text-blue-500 hover:underline">Go back</a>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Leave Category</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white shadow-md rounded-lg p-6"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Category Name *
          </label>
          <input
            {...register("name", { required: "Category name is required" })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
          />
          {errors.name && (
            <p className="text-red-500 text-xs italic">{errors.name.message}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            {...register("description")}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Default Minimum Days *
            </label>
            <input
              {...register("defaultMinDays", { 
                required: "Minimum days is required",
                valueAsNumber: true,
                min: { value: 0.5, message: "Minimum days must be at least 0.5" }
              })}
              type="number"
              step="0.5"
              min="0.5"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.defaultMinDays && (
              <p className="text-red-500 text-xs italic">{errors.defaultMinDays.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Default Maximum Days *
            </label>
            <input
              {...register("defaultMaxDays", { 
                required: "Maximum days is required",
                valueAsNumber: true,
                min: { value: 0.5, message: "Maximum days must be at least 0.5" }
              })}
              type="number"
              step="0.5"
              min="0.5"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.defaultMaxDays && (
              <p className="text-red-500 text-xs italic">{errors.defaultMaxDays.message}</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Maximum Approval Levels *
          </label>
          <input
            {...register("maxApprovalLevels", { 
              required: "Maximum approval levels is required",
              valueAsNumber: true,
              min: { value: 1, message: "At least 1 approval level is required" },
              max: { value: 5, message: "Maximum 5 approval levels allowed" }
            })}
            type="number"
            min="1"
            max="5"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          {errors.maxApprovalLevels && (
            <p className="text-red-500 text-xs italic">{errors.maxApprovalLevels.message}</p>
          )}
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              {...register("isActive")}
              className="mr-2 h-5 w-5"
            />
            <span className="text-gray-700">
              Active Category (when inactive, this category won't be used for leave approvals)
            </span>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("isDefault")}
              className="mr-2 h-5 w-5"
            />
            <span className="text-gray-700">
              Default Category (will be used as the default for new workflows)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin/leave-categories")}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update Category"}
          </button>
        </div>
      </form>
    </div>
  );
}