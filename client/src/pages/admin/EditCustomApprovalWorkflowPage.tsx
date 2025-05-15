import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getCustomApprovalWorkflowById, updateCustomApprovalWorkflow } from "../../services/customApprovalWorkflowService";
import { getAllDepartments } from "../../services/departmentService";
import { getAllPositions, getAssignedPositionsByDepartment } from "../../services/positionService";
import { getAllTopLevelPositions } from "../../services/topLevelPositionService";
import { getAllLeaveCategories } from "../../services/leaveCategoryService";

// Define interfaces for our data structures
interface Position {
  id: string;
  name: string;
  departmentId?: string;
  departmentName?: string;
  employeeInfo?: any;
}

interface Department {
  id: string;
  name: string;
}

interface LeaveCategory {
  id: string;
  name: string;
  defaultMinDays: number;
  defaultMaxDays: number;
  maxApprovalLevels: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  leaveCategoryId?: string;
  minDays: number;
  maxDays: number;
  departmentId?: string;
  positionId?: string;
  isActive: boolean;
  isDefault: boolean;
  approvalLevels: ApprovalLevel[];
  positionName?: string;
  departmentName?: string;
}

interface ApprovalLevel {
  level: number;
  positionId: string;
  departmentId?: string;
  isRequired: boolean;
  positionName?: string;
  departmentName?: string;
}

type FormValues = {
  name: string;
  description: string;
  category: string; // For backward compatibility
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
    positionName?: string; // Added for better display
    departmentName?: string; // Added for better display
  }[];
};

export default function EditCustomApprovalWorkflowPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      description: "",
      category: "short_leave", // For backward compatibility
      leaveCategoryId: "",
      minDays: 0.5,
      maxDays: 2,
      departmentId: "",
      positionId: "",
      isActive: true,
      isDefault: false,
      approvalLevels: [{ 
        level: 1, 
        positionId: "", 
        departmentId: "", 
        isRequired: true,
        positionName: "",
        departmentName: ""
      }],
    },
  });

  const watchApprovalLevels = watch("approvalLevels");
  // const watchCategory = watch("category"); // Commented out as it's not used
  const watchLeaveCategory = watch("leaveCategoryId");
  const watchDepartmentId = watch("departmentId");

  const { data: workflow, isLoading: isLoadingWorkflow } = useQuery<Workflow>({
    queryKey: ["customWorkflow", id],
    queryFn: () => getCustomApprovalWorkflowById(id as string),
    enabled: !!id,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: () => getAllDepartments(),
  });

  const { data: positions = [] } = useQuery<Position[]>({
    queryKey: ["positions"],
    queryFn: () => getAllPositions(),
  });
  
  // Get positions filtered by department
  const { data: departmentPositions = [], refetch: refetchDepartmentPositions } = useQuery<Position[]>({
    queryKey: ["positions", watchDepartmentId],
    queryFn: () => getAllPositions({ departmentId: watchDepartmentId }),
    enabled: !!watchDepartmentId,
  });
  
  // Get positions that are actually assigned to users in this department
  const { data: assignedPositions = [], refetch: refetchAssignedPositions } = useQuery<Position[]>({
    queryKey: ["assignedPositions", watchDepartmentId],
    queryFn: () => getAssignedPositionsByDepartment(watchDepartmentId),
    enabled: !!watchDepartmentId,
  });

  const { data: topLevelPositions = [] } = useQuery<Position[]>({
    queryKey: ["topLevelPositions"],
    queryFn: () => getAllTopLevelPositions(),
  });
  
  const { data: leaveCategories = [] } = useQuery<LeaveCategory[]>({
    queryKey: ["leaveCategories"],
    queryFn: () => getAllLeaveCategories(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "approvalLevels",
  });

  useEffect(() => {
    if (workflow && !isLoadingWorkflow) {
      // Process approval levels to ensure all required data is present
      const processedApprovalLevels = workflow.approvalLevels.map((level: ApprovalLevel) => {
        // Find position details if available
        const positionDetails = positions.find(p => p.id === level.positionId) as Position | undefined;
        
        // Find department details if available
        const departmentDetails = departments.find(d => d.id === (level.departmentId || workflow.departmentId)) as Department | undefined;
        
        // Ensure we have all the necessary fields
        return {
          level: level.level,
          positionId: level.positionId || "",
          // Preserve the original department ID for each approval level
          departmentId: level.departmentId || workflow.departmentId || "",
          isRequired: level.isRequired,
          // Store additional information for reference - use data from API if available
          positionName: level.positionName || (positionDetails?.name || ""),
          departmentName: level.departmentName || (departmentDetails?.name || ""),
        };
      });
      
      // Find main position and department details
      const mainPositionDetails = workflow.positionId ? positions.find(p => p.id === workflow.positionId) as Position | undefined : undefined;
      const mainDepartmentDetails = workflow.departmentId ? departments.find(d => d.id === workflow.departmentId) as Department | undefined : undefined;
      
      // Store position and department names for reference
      if (mainPositionDetails?.name && !workflow.positionName) {
        workflow.positionName = mainPositionDetails.name;
      }
      
      if (mainDepartmentDetails?.name && !workflow.departmentName) {
        workflow.departmentName = mainDepartmentDetails.name;
      }
      
      // Log the workflow data for debugging
      console.log("Loaded workflow:", {
        ...workflow,
        positionName: workflow.positionName || (mainPositionDetails?.name || ""),
        departmentName: workflow.departmentName || (mainDepartmentDetails?.name || "")
      });
      
      reset({
        name: workflow.name,
        description: workflow.description || "",
        category: workflow.category,
        leaveCategoryId: workflow.leaveCategoryId || "",
        minDays: workflow.minDays,
        maxDays: workflow.maxDays,
        departmentId: workflow.departmentId || "",
        positionId: workflow.positionId || "",
        isActive: workflow.isActive,
        isDefault: workflow.isDefault,
        approvalLevels: processedApprovalLevels,
      });
      
      // Refresh position data for each department in approval levels
      processedApprovalLevels.forEach((level: any) => {
        if (level.departmentId && level.departmentId !== workflow.departmentId) {
          // Trigger a fetch for positions in this department
          getAllPositions({ departmentId: level.departmentId });
        }
      });
      
      setIsLoading(false);
    }
  }, [workflow, isLoadingWorkflow, reset, positions, departments]);
  
  // Update min/max days when a leave category is selected
  useEffect(() => {
    if (watchLeaveCategory) {
      const selectedCategory = leaveCategories.find((cat: LeaveCategory) => cat.id === watchLeaveCategory);
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
  // Only apply to new approval levels or those without a department
  useEffect(() => {
    if (watchDepartmentId) {
      // Only update approval levels that don't have a department set
      watchApprovalLevels.forEach((level, index) => {
        // If this level doesn't have a department set, use the main department
        if (!level.departmentId) {
          setValue(`approvalLevels.${index}.departmentId`, watchDepartmentId);
        }
      });
      
      // Ensure assigned positions are refreshed
      if (refetchAssignedPositions) {
        refetchAssignedPositions();
      }
    }
  }, [watchDepartmentId, setValue, watchApprovalLevels, refetchAssignedPositions]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateCustomApprovalWorkflow(id as string, data),
    onSuccess: () => {
      navigate("/approval-workflow-customization");
    },
    onError: (err: any) => {
      setError(
        err.response?.data?.message || "Failed to update custom approval workflow"
      );
    },
  });

  const onSubmit = (data: FormValues) => {
    // Ensure approval levels are properly ordered
    const formattedApprovalLevels = data.approvalLevels.map((level, index) => {
      // Find the position details to include employee information
      const positionDetails = positions.find(p => p.id === level.positionId) as Position | undefined;
      
      // Find department details
      const departmentId = level.departmentId || positionDetails?.departmentId || data.departmentId || null;
      const departmentDetails = departments.find(d => d.id === departmentId) as Department | undefined;
      
      return {
        ...level,
        level: index + 1,
        // Ensure departmentId is properly set (use the position's department if available)
        departmentId: departmentId,
        // Include position name for better display in approval workflows
        positionName: (positionDetails?.name || level.positionName || null),
        departmentName: (departmentDetails?.name || level.departmentName || positionDetails?.departmentName || null),
        // Include any employee information if available
        employeeInfo: positionDetails?.employeeInfo || null,
      };
    });

    // Log the data being saved for debugging
    console.log("Saving approval workflow with levels:", formattedApprovalLevels);

    // Get main position details if selected
    const mainPositionDetails = data.positionId ? positions.find(p => p.id === data.positionId) as Position | undefined : undefined;
    const mainDepartmentDetails = data.departmentId ? departments.find(d => d.id === data.departmentId) as Department | undefined : undefined;
    
    // Determine position and department names
    const positionName = (mainPositionDetails?.name || 
                         (workflow?.positionId === data.positionId ? workflow?.positionName : null) || 
                         null);
                         
    const departmentName = (mainDepartmentDetails?.name || 
                          (workflow?.departmentId === data.departmentId ? workflow?.departmentName : null) || 
                          null);
    
    // Log what we're saving for debugging
    console.log("Saving main position/department:", {
      positionId: data.positionId,
      positionName,
      departmentId: data.departmentId,
      departmentName
    });
    
    updateMutation.mutate({
      name: data.name,
      description: data.description,
      category: data.category, // Keep for backward compatibility
      leaveCategoryId: data.leaveCategoryId || null,
      minDays: data.minDays,
      maxDays: data.maxDays,
      departmentId: data.departmentId || null,
      positionId: data.positionId || null,
      // Include position and department names for the main workflow
      positionName: positionName,
      departmentName: departmentName,
      approvalLevels: formattedApprovalLevels,
      isActive: data.isActive,
      isDefault: data.isDefault,
    });
  };

  const addApprovalLevel = () => {
    // Check if we've reached the maximum approval levels for the selected category
    if (watchLeaveCategory) {
      const selectedCategory = leaveCategories.find((cat: LeaveCategory) => cat.id === watchLeaveCategory);
      if (selectedCategory && fields.length >= selectedCategory.maxApprovalLevels) {
        setError(`Maximum of ${selectedCategory.maxApprovalLevels} approval levels allowed for this category`);
        return;
      }
    }
    
    // Get department name if a department is selected
    const departmentName = watchDepartmentId 
      ? departments.find((dept: Department) => dept.id === watchDepartmentId)?.name || ""
      : "";
      
    append({
      level: fields.length + 1,
      positionId: "",
      departmentId: watchDepartmentId || "", // Use the main department if selected
      isRequired: true,
      positionName: "",
      departmentName: departmentName,
    });
  };

  if (isLoading || isLoadingWorkflow) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading workflow data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Custom Approval Workflow</h1>

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
            {/* Show currently selected department name if available */}
            {workflow?.departmentId && (
              <p className="text-xs text-blue-600 mb-1 font-semibold">
                Currently selected: {workflow.departmentName || 
                  departments.find(d => d.id === workflow.departmentId)?.name || 
                  `Department ID: ${workflow.departmentId}`}
              </p>
            )}
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
            {/* Show currently selected position name if available */}
            {workflow?.positionId && (
              <p className="text-xs text-blue-600 mb-1 font-semibold">
                Currently selected: {workflow.positionName || 
                  positions.find(p => p.id === workflow.positionId)?.name || 
                  `Position ID: ${workflow.positionId}`}
              </p>
            )}
            <select
              {...register("positionId")}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Positions</option>
              
              {/* Show the currently selected position first if it exists */}
              {workflow?.positionId && (
                <optgroup label="Currently Selected Position">
                  {/* First try to find the position in the positions list */}
                  {positions.filter(pos => pos.id === workflow.positionId).length > 0 ? (
                    positions
                      .filter(pos => pos.id === workflow.positionId)
                      .map(position => (
                        <option key={position.id} value={position.id}>
                          {position.name} {position.departmentName ? `(${position.departmentName})` : ''}
                        </option>
                      ))
                  ) : (
                    /* If not found in positions list, create an option with the saved name */
                    <option key={workflow.positionId} value={workflow.positionId}>
                      {workflow.positionName || `Position ID: ${workflow.positionId}`}
                    </option>
                  )}
                </optgroup>
              )}
              
              {/* When department is selected */}
              {watchDepartmentId ? (
                <>
                  {/* Positions assigned to users */}
                  {assignedPositions.length > 0 && (
                    <optgroup label="Currently Staffed Positions">
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
                  {watchApprovalLevels[index]?.departmentName && (
                    <p className="text-xs text-gray-600 mt-1">
                      Currently: {watchApprovalLevels[index].departmentName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Position *
                  </label>
                  {watchApprovalLevels[index]?.positionName && (
                    <p className="text-xs text-blue-600 mb-1">
                      Currently selected: {watchApprovalLevels[index].positionName}
                    </p>
                  )}
                  <select
                    {...register(`approvalLevels.${index}.positionId`, {
                      required: "Position is required",
                    })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select a position</option>
                    
                    {/* Show the currently selected position first if it exists */}
                    {watchApprovalLevels[index]?.positionId && (
                      <optgroup label="Currently Selected Position">
                        {positions
                          .filter(pos => pos.id === watchApprovalLevels[index].positionId)
                          .map(position => (
                            <option key={position.id} value={position.id}>
                              {position.name} {position.departmentName ? `(${position.departmentName})` : ''}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    
                    {topLevelPositions.length > 0 && (
                      <optgroup label="Top Level Positions">
                        {topLevelPositions.map((position: any) => (
                          <option key={position.id} value={position.id}>
                            {position.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    
                    {/* If this approval level has a department selected */}
                    {watchApprovalLevels[index]?.departmentId && (
                      <>
                        {/* Get positions for this specific department */}
                        {positions
                          .filter((pos: any) => pos.departmentId === watchApprovalLevels[index].departmentId)
                          .length > 0 && (
                          <optgroup label={`Positions in Selected Department`}>
                            {positions
                              .filter((pos: any) => pos.departmentId === watchApprovalLevels[index].departmentId)
                              .map((position: any) => (
                                <option key={position.id} value={position.id}>
                                  {position.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        
                        {/* Show assigned positions if this is the main department */}
                        {watchApprovalLevels[index].departmentId === watchDepartmentId && assignedPositions.length > 0 && (
                          <optgroup label="Currently Staffed Positions">
                            {assignedPositions.map((position: any) => (
                              <option key={position.id} value={position.id}>
                                {position.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    )}
                    
                    {/* If no department is selected for this approval level, show all positions */}
                    {!watchApprovalLevels[index]?.departmentId && (
                      <optgroup label="All Positions">
                        {positions.map((position: any) => (
                          <option key={position.id} value={position.id}>
                            {position.name} {position.departmentName ? `(${position.departmentName})` : ''}
                          </option>
                        ))}
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
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Updating..." : "Update Workflow"}
          </button>
        </div>
      </form>
    </div>
  );
}