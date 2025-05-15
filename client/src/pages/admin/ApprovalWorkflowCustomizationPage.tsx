import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAllCustomApprovalWorkflows, initializeDefaultCustomApprovalWorkflows } from "../../services/customApprovalWorkflowService";
import { getAllDepartments } from "../../services/departmentService";
import { getAllPositions } from "../../services/positionService";
import { getAllTopLevelPositions } from "../../services/topLevelPositionService";
import { FaEdit, FaTrash, FaPlus, FaSync, FaInfoCircle } from "react-icons/fa";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCustomApprovalWorkflow } from "../../services/customApprovalWorkflowService";

export default function ApprovalWorkflowCustomizationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isHardcodedWorkflowEnabled, setIsHardcodedWorkflowEnabled] = useState<boolean>(true);

  const { data: customWorkflows = [], isLoading: isLoadingWorkflows } = useQuery({
    queryKey: ["customWorkflows", selectedCategory, selectedDepartment, selectedPosition],
    queryFn: () => getAllCustomApprovalWorkflows({
      category: selectedCategory,
      departmentId: selectedDepartment,
      positionId: selectedPosition,
    }),
  });

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

  const initializeDefaultsMutation = useMutation({
    mutationFn: initializeDefaultCustomApprovalWorkflows,
    onSuccess: () => {
      setSuccess("Default approval workflows initialized successfully");
      queryClient.invalidateQueries({ queryKey: ["customWorkflows"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to initialize default workflows");
      setTimeout(() => setError(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomApprovalWorkflow,
    onSuccess: () => {
      setSuccess("Workflow deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["customWorkflows"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to delete workflow");
      setTimeout(() => setError(null), 3000);
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this workflow?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleInitializeDefaults = () => {
    if (window.confirm("This will reset all default workflows. Are you sure?")) {
      initializeDefaultsMutation.mutate();
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "short_leave":
        return "Short Leave (0.5-2 days)";
      case "medium_leave":
        return "Medium Leave (3-6 days)";
      case "long_leave":
        return "Long Leave (7+ days)";
      default:
        return category;
    }
  };

  const getDepartmentName = (departmentId: string | null) => {
    if (!departmentId) return "All Departments";
    const department = departments.find((d: any) => d.id === departmentId);
    return department ? department.name : "Unknown Department";
  };

  const getPositionName = (positionId: string | null) => {
    if (!positionId) return "All Positions";
    const position = positions.find((p: any) => p.id === positionId);
    return position ? position.name : "Unknown Position";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Approval Workflow Customization</h1>
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
            onClick={() => navigate("/custom-approval-workflow/create")}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
          >
            <FaPlus className="mr-2" />
            Create Workflow
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

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filter Workflows</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Leave Category
            </label>
            <select
              value={selectedCategory || ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">All Categories</option>
              <option value="short_leave">Short Leave (0.5-2 days)</option>
              <option value="medium_leave">Medium Leave (3-6 days)</option>
              <option value="long_leave">Long Leave (7+ days)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Department
            </label>
            <select
              value={selectedDepartment || ""}
              onChange={(e) => setSelectedDepartment(e.target.value || null)}
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
              Position
            </label>
            <select
              value={selectedPosition || ""}
              onChange={(e) => setSelectedPosition(e.target.value || null)}
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
      </div>

      {/* Hardcoded Workflow Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Hardcoded Position-Based Approval Workflow</h2>
          <div className="flex items-center">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isHardcodedWorkflowEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} mr-3`}>
              {isHardcodedWorkflowEnabled ? 'Active' : 'Inactive'}
            </span>
            <label className="inline-flex items-center cursor-pointer">
              <span className="mr-2 text-sm font-medium text-gray-700">Enable</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isHardcodedWorkflowEnabled}
                  onChange={() => {
                    setIsHardcodedWorkflowEnabled(!isHardcodedWorkflowEnabled);
                    if (isHardcodedWorkflowEnabled) {
                      setSuccess("Note: Disabling the hardcoded workflow requires code changes. This toggle is for demonstration purposes only.");
                      setTimeout(() => setSuccess(null), 5000);
                    }
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            This system is currently using a hardcoded position-based approval workflow that overrides the database configurations.
          </p>
          <p className="text-gray-700 mb-2">
            The workflow is based on the requester's position and the leave duration category.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-bold text-lg mb-2">Workflow for INTERN</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">INTERN → TEAM_LEAD → HR MANAGER → HR DIRECTOR → ADMIN</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Short Leave (0.5-2 days): All 4 levels required</li>
                <li>Medium Leave (3-6 days): All 4 levels required</li>
                <li>Long Leave (7+ days): All 4 levels required</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-2">Workflow for TEAM_LEAD</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">TEAM_LEAD → HR MANAGER → HR DIRECTOR → ADMIN</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Short Leave (0.5-2 days): Only 2 levels (HR MANAGER → HR DIRECTOR)</li>
                <li>Medium Leave (3-6 days): 3 levels (HR MANAGER → HR DIRECTOR → ADMIN)</li>
                <li>Long Leave (7+ days): 3 levels (HR MANAGER → HR DIRECTOR → ADMIN)</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-2">Workflow for HR MANAGER</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">HR MANAGER → HR DIRECTOR</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>All leave categories: Only 1 level (HR DIRECTOR)</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold text-lg mb-2">Workflow for HR DIRECTOR</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium mb-2">HR DIRECTOR → ADMIN</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>All leave categories: Only 1 level (ADMIN)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaInfoCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Note:</span> This hardcoded workflow takes precedence over any database configurations. 
                To use the database-configured workflows instead, the hardcoded workflow needs to be removed from the code.
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                <span className="font-bold">Implementation:</span> The hardcoded workflow is implemented in the client-side code 
                in <code className="bg-gray-100 px-1 py-0.5 rounded">TeamLeavesPage.tsx</code> and overrides any workflow configurations 
                from the database.
              </p>
              <div className="mt-3">
                <button 
                  onClick={() => {
                    setSuccess("To modify the hardcoded workflow, you would need to edit the TeamLeavesPage.tsx file. This button is for demonstration purposes only.");
                    setTimeout(() => setSuccess(null), 5000);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded"
                >
                  View Implementation Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Configured Workflows */}
      <h2 className="text-xl font-semibold mb-4">Database Configured Workflows</h2>
      <p className="text-gray-700 mb-4">
        The following workflows are configured in the database but are {isHardcodedWorkflowEnabled ? 'currently overridden by the hardcoded workflow' : 'will be used when the hardcoded workflow is disabled'}.
      </p>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Range
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Approval Levels
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
            {isLoadingWorkflows ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : customWorkflows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  No workflows found. Create a new workflow or initialize defaults.
                </td>
              </tr>
            ) : (
              customWorkflows.map((workflow: any) => (
                <tr key={workflow.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {workflow.name}
                    </div>
                    {workflow.isDefault && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getCategoryLabel(workflow.category)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {workflow.minDays} - {workflow.maxDays} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getDepartmentName(workflow.departmentId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getPositionName(workflow.positionId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {workflow.approvalLevels.length} levels
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        workflow.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {workflow.isActive ? "Active" : "Inactive"}
                    </span>
                    {isHardcodedWorkflowEnabled && (
                      <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Overridden
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/custom-approval-workflow/edit/${workflow.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(workflow.id)}
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