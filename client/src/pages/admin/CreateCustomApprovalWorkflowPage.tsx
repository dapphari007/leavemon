import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createCustomApprovalWorkflow } from "../../services/customApprovalWorkflowService";
import { getAllDepartments } from "../../services/departmentService";
import { getAllPositions, getAssignedPositionsByDepartment } from "../../services/positionService";
import { getAllTopLevelPositions } from "../../services/topLevelPositionService";
import { getAllLeaveCategories } from "../../services/leaveCategoryService";

type FormValues = {
  name: string;
  description: string;
  category: string;
  leaveCategoryId: string;
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

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      category: "custom", // For backward compatibility
      leaveCategoryId: "",
      minDays: 0.5,
      maxDays: 2,
      departmentId: "",
      positionId: "",
      isActive: true,
      isDefault: false,
      approvalLevels: [{ level: 1, positionId: "", departmentId: "", isRequired: true }],
    },
    mode: "onSubmit",
  });

  const watchApprovalLevels = watch("approvalLevels");
  const watchCategory = watch("category");
  const watchLeaveCategory = watch("leaveCategoryId");
  const watchDepartmentId = watch("departmentId");

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments(),
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions"],
    queryFn: () => getAllPositions(),
  });
  
  // Get positions filtered by department
  const { data: departmentPositions = [], refetch: refetchDepartmentPositions } = useQuery({
    queryKey: ["positions", watchDepartmentId],
    queryFn: () => getAllPositions({ departmentId: watchDepartmentId }),
    enabled: !!watchDepartmentId,
  });
  
  // Get positions that are actually assigned to users in this department
  const { data: assignedPositions = [], refetch: refetchAssignedPositions } = useQuery({
    queryKey: ["assignedPositions", watchDepartmentId],
    queryFn: () => getAssignedPositionsByDepartment(watchDepartmentId),
    enabled: !!watchDepartmentId,
  });

  const { data: topLevelPositions = [] } = useQuery({
    queryKey: ["topLevelPositions"],
    queryFn: () => getAllTopLevelPositions(),
  });
  
  const { data: leaveCategories = [] } = useQuery({
    queryKey: ["leaveCategories"],
    queryFn: () => getAllLeaveCategories(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "approvalLevels",
  });

  // Update min/max days when a leave category is selected
  useEffect(() => {
    if (watchLeaveCategory) {
      const selectedCategory = leaveCategories.find((cat: any) => cat.id === watchLeaveCategory);
      if (selectedCategory) {
        setValue("minDays", selectedCategory.defaultMinDays);
        setValue("maxDays", selectedCategory.defaultMaxDays);
      }
    }
  }, [watchLeaveCategory, leaveCategories, setValue]);
  
  // Reset main position when department changes
  useEffect(() => {
    // Reset position when department changes
    setValue("positionId", "");
    
    // Ensure department positions are refreshed
    if (watchDepartmentId) {
      if (refetchDepartmentPositions) {
        refetchDepartmentPositions();
      }
      if (refetchAssignedPositions) {
        refetchAssignedPositions();
      }
    }
  }, [watchDepartmentId, setValue, refetchDepartmentPositions, refetchAssignedPositions]);

  // Update approval levels department when main department changes
  useEffect(() => {
    if (watchDepartmentId) {
      // Update all approval levels to use the selected department
      const updatedApprovalLevels = watchApprovalLevels.map(level => ({
        ...level,
        departmentId: watchDepartmentId
      }));
      
      // Update each approval level
      updatedApprovalLevels.forEach((level, index) => {
        setValue(`approvalLevels.${index}.departmentId`, watchDepartmentId);
        // Reset position selection when department changes
        setValue(`approvalLevels.${index}.positionId`, "");
      });
      
      // Ensure assigned positions are refreshed
      if (refetchAssignedPositions) {
        refetchAssignedPositions();
      }
    }
  }, [watchDepartmentId, setValue, watchApprovalLevels, refetchAssignedPositions]);

  const createMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("Mutation function called with data:", data);
      return createCustomApprovalWorkflow(data);
    },
    onSuccess: (data) => {
      console.log("Mutation success callback with data:", data);
      navigate("/approval-workflow-customization");
    },
    onError: (err: any) => {
      console.error("Mutation error callback with error:", err);
      setError(
        err.response?.data?.message || "Failed to create custom approval workflow"
      );
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted with data:", data);
    
    // Validate that at least one approval level is added
    if (!data.approvalLevels || data.approvalLevels.length === 0) {
      setError("At least one approval level is required");
      return;
    }
    
    // Validate that all approval levels have a position selected
    const invalidLevels = data.approvalLevels.filter(level => !level.positionId);
    if (invalidLevels.length > 0) {
      setError(`Please select a position for all approval levels`);
      return;
    }
    
    // Ensure approval levels are properly ordered
    const formattedApprovalLevels = data.approvalLevels.map((level, index) => ({
      ...level,
      level: index + 1,
    }));

    const payload = {
      name: data.name,
      description: data.description,
      category: data.category || "custom", // Keep for backward compatibility
      leaveCategoryId: data.leaveCategoryId || null,
      minDays: Number(data.minDays),
      maxDays: Number(data.maxDays),
      departmentId: data.departmentId || null,
      positionId: data.positionId || null,
      approvalLevels: formattedApprovalLevels,
      isActive: Boolean(data.isActive),
      isDefault: Boolean(data.isDefault),
    };
    
    console.log("Sending payload to server:", payload);
    
    createMutation.mutate(payload);
  };

  const addApprovalLevel = () => {
    // Check if we've reached the maximum approval levels for the selected category
    if (watchLeaveCategory) {
      const selectedCategory = leaveCategories.find((cat: any) => cat.id === watchLeaveCategory);
      if (selectedCategory && fields.length >= selectedCategory.maxApprovalLevels) {
        setError(`Maximum of ${selectedCategory.maxApprovalLevels} approval levels allowed for this category`);
        return;
      }
    }
    
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
            {...register("leaveCategoryId", { required: "Leave category is required" })}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a leave category</option>
            {leaveCategories.map((category: any) => (
              <option key={category.id} value={category.id}>
                {category.name} ({category.defaultMinDays}-{category.defaultMaxDays} days)
              </option>
            ))}
          </select>
          {errors.leaveCategoryId && (
            <p className="text-red-500 text-xs italic">{errors.leaveCategoryId.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            <Link to="/admin/leave-categories" className="text-blue-500 hover:underline">
              Manage leave categories
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Minimum Days (Auto-set from category)
            </label>
            <input
              {...register("minDays", { 
                required: "Minimum days is required",
                valueAsNumber: true
              })}
              type="number"
              step="0.5"
              min="0.5"
              disabled={!!watchLeaveCategory}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
            />
            {errors.minDays && (
              <p className="text-red-500 text-xs italic">{errors.minDays.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Maximum Days (Auto-set from category)
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
              disabled={!!watchLeaveCategory}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100"
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
              
              {/* When department is selected */}
              {watchDepartmentId ? (
                <>
                  {/* Positions assigned to users */}
                  {assignedPositions.length > 0 && (
                    <optgroup label="Regular Positions Available">
                      {assignedPositions.map((position: any) => (
                        <option key={position.id} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* All positions in department */}
                  {departmentPositions.length > 0 && (
                    <optgroup label="All Department Positions">
                      {departmentPositions.map((position: any) => (
                        <option key={position.id} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              ) : (
                /* When no department is selected */
                <optgroup label="All Positions">
                  {positions.map((position: any) => (
                    <option key={position.id} value={position.id}>
                      {position.name} {position.departmentName ? `(${position.departmentName})` : ''}
                    </option>
                  ))}
                </optgroup>
              )}
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
            <div>
              {watchLeaveCategory && (
                <span className="text-sm text-gray-600 mr-2">
                  {fields.length} / {leaveCategories.find((cat: any) => cat.id === watchLeaveCategory)?.maxApprovalLevels || "∞"} levels
                </span>
              )}
              <button
                type="button"
                onClick={addApprovalLevel}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                disabled={!watchLeaveCategory}
              >
                Add Level
              </button>
            </div>
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
                      <option 
                        key={department.id} 
                        value={department.id}
                      >
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
                    
                    {/* Top Level Positions */}
                    {topLevelPositions.length > 0 && (
                      <optgroup label="Top Level Positions">
                        {topLevelPositions.map((position: any) => (
                          <option key={position.id} value={position.id}>
                            {position.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* Positions for selected department */}
                    {watchApprovalLevels[index]?.departmentId && watchApprovalLevels[index].departmentId === watchDepartmentId && (
                      <>
                        {/* Positions assigned to users */}
                        {assignedPositions.length > 0 && (
                          <optgroup label="Regular Positions Available">
                            {assignedPositions.map((position: any) => (
                              <option key={position.id} value={position.id}>
                                {position.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        
                        {/* All positions in department */}
                        <optgroup label="All Department Positions">
                          {departmentPositions.length > 0 ? (
                            departmentPositions.map((position: any) => (
                              <option key={position.id} value={position.id}>
                                {position.name}
                              </option>
                            ))
                          ) : (
                            positions
                              .filter((pos: any) => pos.departmentId === watchApprovalLevels[index].departmentId)
                              .map((position: any) => (
                                <option key={position.id} value={position.id}>
                                  {position.name}
                                </option>
                              ))
                          )}
                        </optgroup>
                      </>
                    )}
                    
                    {/* Positions for other cases */}
                    {(!watchApprovalLevels[index]?.departmentId || watchApprovalLevels[index].departmentId !== watchDepartmentId) && (
                      <optgroup label="Regular Positions">
                        {watchApprovalLevels[index]?.departmentId ? (
                          positions
                            .filter((pos: any) => pos.departmentId === watchApprovalLevels[index].departmentId)
                            .map((position: any) => (
                              <option key={position.id} value={position.id}>
                                {position.name}
                              </option>
                            ))
                        ) : (
                          positions.map((position: any) => (
                            <option key={position.id} value={position.id}>
                              {position.name} {position.departmentName ? `(${position.departmentName})` : ''}
                            </option>
                          ))
                        )}
                      </optgroup>
                    )}
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
            type="button"
            onClick={() => {
              const formData = {
                name: "Test Workflow",
                description: "Test Description",
                category: "custom",
                leaveCategoryId: document.querySelector('select[name="leaveCategoryId"]')?.value,
                minDays: 0.5,
                maxDays: 2,
                departmentId: document.querySelector('select[name="departmentId"]')?.value,
                positionId: document.querySelector('select[name="positionId"]')?.value,
                approvalLevels: [
                  {
                    level: 1,
                    positionId: document.querySelector('select[name="approvalLevels.0.positionId"]')?.value,
                    departmentId: document.querySelector('select[name="approvalLevels.0.departmentId"]')?.value,
                    isRequired: true
                  }
                ],
                isActive: true,
                isDefault: false
              };
              console.log("Debug form data:", formData);
              createMutation.mutate(formData);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2"
          >
            Debug Save
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