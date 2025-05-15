import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createCustomApprovalWorkflow } from "../../services/customApprovalWorkflowService";
import { getAllDepartments } from "../../services/departmentService";
import { getAllPositions } from "../../services/positionService";
import { getAllTopLevelPositions } from "../../services/topLevelPositionService";

type FormValues = {
  name: string;
  description: string;
  category: string;
  minDays: number;
  maxDays: number;
  departmentId: string;
  positionId: string;
  isActive: boolean;
  isDefault: boolean;
  approvalLevels: {
    level: number;
    positionId: string;
    departmentId: string;
    isRequired: boolean;
  }[];
};

export default function CreateCustomApprovalWorkflowPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments(),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: () => getAllPositions(),
  });

  const { data: topLevelPositions = [] } = useQuery({
    queryKey: ["topLevelPositions"],
    queryFn: () => getAllTopLevelPositions(),
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      category: "short_leave",
      minDays: 0.5,
      maxDays: 2,
      departmentId: "",
      positionId: "",
      isActive: true,
      isDefault: false,
      approvalLevels: [{ level: 1, positionId: "", departmentId: "", isRequired: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "approvalLevels",
  });

  const watchApprovalLevels = watch("approvalLevels");
  const watchCategory = watch("category");

  const createMutation = useMutation({
    mutationFn: createCustomApprovalWorkflow,
    onSuccess: () => {
      navigate("/approval-workflow-customization");
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message || "Failed to create custom approval workflow"
      );
    },
  });

  const onSubmit = (data: FormValues) => {
    // Ensure approval levels are properly ordered
    const formattedApprovalLevels = data.approvalLevels.map((level, index) => ({
      ...level,
      level: index + 1,
    }));

    createMutation.mutate({
      name: data.name,
      description: data.description,
      category: data.category,
      minDays: data.minDays,
      maxDays: data.maxDays,
      departmentId: data.departmentId || null,
      positionId: data.positionId || null,
      approvalLevels: formattedApprovalLevels,
      isActive: data.isActive,
      isDefault: data.isDefault,
    });
  };

  const addApprovalLevel = () => {
    append({
      level: fields.length + 1,
      positionId: "",
      departmentId: "",
      isRequired: true,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create Custom Approval Workflow</h1>

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
            Workflow Name *
          </label>
          <input
            {...register("name", { required: "Workflow name is required" })}
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

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Leave Category *
          </label>
          <select
            {...register("category", { required: "Category is required" })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="short_leave">Short Leave (0.5-2 days)</option>
            <option value="medium_leave">Medium Leave (3-6 days)</option>
            <option value="long_leave">Long Leave (7+ days)</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs italic">{errors.category.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Minimum Days *
            </label>
            <input
              {...register("minDays", { 
                required: "Minimum days is required",
                valueAsNumber: true
              })}
              type="number"
              step="0.5"
              min="0.5"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.minDays && (
              <p className="text-red-500 text-xs italic">{errors.minDays.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Maximum Days *
            </label>
            <input
              {...register("maxDays", { 
                required: "Maximum days is required",
                valueAsNumber: true,
                min: 0.5
              })}
              type="number"
              step="0.5"
              min="0.5"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {errors.maxDays && (
              <p className="text-red-500 text-xs italic">{errors.maxDays.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Department (Optional)
            </label>
            <select
              {...register("departmentId")}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Departments</option>
              {departments.map((department: any) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Position (Optional)
            </label>
            <select
              {...register("positionId")}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Positions</option>
              {positions.map((position: any) => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              {...register("isActive")}
              className="mr-2 h-5 w-5"
            />
            <span className="text-gray-700">
              Active Workflow (when inactive, this workflow won't be used for leave approvals)
            </span>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("isDefault")}
              className="mr-2 h-5 w-5"
            />
            <span className="text-gray-700">
              Default Workflow (will be used as the default for this category)
            </span>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Approval Levels</h3>
            <button
              type="button"
              onClick={addApprovalLevel}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
            >
              Add Level
            </button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-lg p-4 mb-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Level {index + 1}</h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Department (Optional)
                  </label>
                  <select
                    {...register(`approvalLevels.${index}.departmentId`)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Any Department</option>
                    {departments.map((department: any) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Position *
                  </label>
                  <select
                    {...register(`approvalLevels.${index}.positionId`, {
                      required: "Position is required",
                    })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select a position</option>
                    {topLevelPositions.length > 0 && (
                      <optgroup label="Top Level Positions">
                        {topLevelPositions.map((position: any) => (
                          <option key={position.id} value={position.id}>
                            {position.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Regular Positions">
                      {positions.map((position: any) => (
                        <option key={position.id} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  {errors.approvalLevels?.[index]?.positionId && (
                    <p className="text-red-500 text-xs italic">
                      Position is required
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  {...register(`approvalLevels.${index}.isRequired`)}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm">
                  Required Approval (cannot be skipped)
                </span>
              </div>
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No approval levels added yet.</p>
              <button
                type="button"
                onClick={addApprovalLevel}
                className="mt-2 text-blue-600 hover:underline"
              >
                Add your first level
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate("/approval-workflow-customization")}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Workflow"}
          </button>
        </div>
      </form>
    </div>
  );
}