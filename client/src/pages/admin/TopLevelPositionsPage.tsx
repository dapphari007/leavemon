import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllTopLevelPositions, 
  createTopLevelPosition, 
  updateTopLevelPosition, 
  deleteTopLevelPosition 
} from "../../services/topLevelPositionService";
import { getAllPositions } from "../../services/positionService";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";

export default function TopLevelPositionsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    level: 1,
    isActive: true,
    positionId: "", // Add positionId field
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: topLevelPositions = [], isLoading: isLoadingTopLevelPositions } = useQuery({
    queryKey: ["topLevelPositions"],
    queryFn: () => getAllTopLevelPositions(),
  });

  // Fetch all regular positions
  const { data: regularPositions = [], isLoading: isLoadingPositions } = useQuery({
    queryKey: ["positions"],
    queryFn: () => getAllPositions(),
  });

  const createMutation = useMutation({
    mutationFn: createTopLevelPosition,
    onSuccess: () => {
      setSuccess("Position created successfully");
      queryClient.invalidateQueries({ queryKey: ["topLevelPositions"] });
      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to create position");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTopLevelPosition(id, data),
    onSuccess: () => {
      setSuccess("Position updated successfully");
      queryClient.invalidateQueries({ queryKey: ["topLevelPositions"] });
      closeModal();
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to update position");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTopLevelPosition,
    onSuccess: () => {
      setSuccess("Position deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["topLevelPositions"] });
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Failed to delete position");
      setTimeout(() => setError(null), 3000);
    },
  });

  const openCreateModal = () => {
    setFormData({
      name: "",
      description: "",
      level: 1,
      isActive: true,
      positionId: "",
    });
    setIsEditMode(false);
    setIsModalOpen(true);
    setError(null);
  };

  const openEditModal = (position: any) => {
    setFormData({
      name: position.name,
      description: position.description || "",
      level: position.level,
      isActive: position.isActive,
      positionId: position.positionId || "",
    });
    setCurrentPosition(position);
    setIsEditMode(true);
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else if (name === "level") {
      setFormData({
        ...formData,
        [name]: parseInt(value, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name && !formData.positionId) {
      setError("Either name or position selection is required");
      return;
    }

    if (formData.level < 1) {
      setError("Level must be a positive integer");
      return;
    }

    // If a position is selected, use its name
    let dataToSubmit = { ...formData };
    
    if (formData.positionId) {
      const selectedPosition = regularPositions.find(
        (pos: any) => pos.id === formData.positionId
      );
      
      if (selectedPosition) {
        dataToSubmit.name = selectedPosition.name;
        dataToSubmit.description = dataToSubmit.description || selectedPosition.description || "";
      }
    }

    if (isEditMode && currentPosition) {
      updateMutation.mutate({
        id: currentPosition.id,
        data: dataToSubmit,
      });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this position?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Top Level Positions</h1>
        <button
          onClick={openCreateModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
        >
          <FaPlus className="mr-2" />
          Add Position
        </button>
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
                Level
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
            {isLoadingTopLevelPositions ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : topLevelPositions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  No top level positions found. Create a new position.
                </td>
              </tr>
            ) : (
              topLevelPositions.map((position: any) => (
                <tr key={position.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {position.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {position.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {position.level}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        position.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {position.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(position)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(position.id)}
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

      {/* Modal for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {isEditMode ? "Edit Position" : "Create Position"}
            </h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Existing Position
                </label>
                <select
                  name="positionId"
                  value={formData.positionId}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="">-- Create New Position --</option>
                  {isLoadingPositions ? (
                    <option disabled>Loading positions...</option>
                  ) : (
                    regularPositions.map((position: any) => (
                      <option key={position.id} value={position.id}>
                        {position.name} {position.department ? `(${position.department.name})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select an existing position or create a new one below
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {formData.positionId ? "Position Name (Auto-filled)" : "Name *"}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    formData.positionId ? "bg-gray-100" : ""
                  }`}
                  disabled={!!formData.positionId}
                  required={!formData.positionId}
                />
                {formData.positionId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Name will be taken from the selected position
                  </p>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    formData.positionId ? "bg-gray-100" : ""
                  }`}
                  rows={3}
                  placeholder={formData.positionId ? "Will use description from selected position if left empty" : ""}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Level *
                </label>
                <input
                  type="number"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  min="1"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="mr-2 h-5 w-5"
                  />
                  <span className="text-gray-700">
                    Active Position
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : isEditMode
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}