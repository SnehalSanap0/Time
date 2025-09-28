import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Cpu, Users, MapPin, Wrench, AlertCircle, Clock } from 'lucide-react';
import { useTimetableData } from '../hooks/useTimetableData';
import { Lab } from '../types/timetable';
import { LoadingSpinner } from './LoadingSpinner';

const LabManagement = () => {
  const { 
    labs, 
    loading, 
    error, 
    addLab, 
    updateLab, 
    deleteLab,
    clearError 
  } = useTimetableData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 30,
    type: '',
    equipment: [] as string[],
    floor: 1,
    availableHours: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 30,
      type: '',
      equipment: [],
      floor: 1,
      availableHours: [],
    });
    setEditingLab(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingLab) {
        await updateLab(editingLab.id!, formData);
      } else {
        await addLab(formData);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving lab:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (lab: Lab) => {
    setFormData({
      name: lab.name,
      capacity: lab.capacity,
      type: lab.type,
      equipment: lab.equipment,
      floor: lab.floor,
      availableHours: lab.availableHours,
    });
    setEditingLab(lab);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this laboratory?')) {
      try {
        await deleteLab(id);
      } catch (err) {
        console.error('Error deleting lab:', err);
      }
    }
  };

  const handleEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, equipment: [...formData.equipment, equipment] });
    } else {
      setFormData({ ...formData, equipment: formData.equipment.filter(e => e !== equipment) });
    }
  };

  const handleTimeSlotChange = (timeSlot: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, availableHours: [...formData.availableHours, timeSlot] });
    } else {
      setFormData({ ...formData, availableHours: formData.availableHours.filter(h => h !== timeSlot) });
    }
  };

  const availableEquipment = [
    '30 PCs', 'Projector', 'AC', 'Server', 'Network Equipment', 
    'Switches', 'Routers', 'High-end PCs', 'GPU Servers', 
    'Development Tools', 'Collaboration Tools', 'Whiteboard',
    'Smart Board', 'Audio System'
  ];

  const timeSlots = [
    '8:00-9:00', '9:00-10:00', '10:15-11:15', '11:15-12:15',
    '1:15-3:15', '3:15-5:15'
  ];

  const labTypes = [
    'Computer Lab', 'Specialized Lab', 'Research Lab', 
    'Development Lab', 'General Lab', 'Hardware Lab'
  ];

  if (loading) {
    return <LoadingSpinner text="Loading laboratories..." />;
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laboratory Management</h2>
          <p className="text-gray-600 mt-1">
            Manage laboratory capacity, equipment, and availability
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Laboratory</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingLab ? 'Edit Laboratory' : 'Add New Laboratory'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Laboratory Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                  placeholder="e.g., Programming Lab 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  min="10"
                  max="50"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Laboratory Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                >
                  <option value="">Select Type</option>
                  {labTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Equipment
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableEquipment.map((equipment) => (
                  <label key={equipment} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.equipment.includes(equipment)}
                      onChange={(e) => handleEquipmentChange(equipment, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">{equipment}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Hours
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {timeSlots.map((slot) => (
                  <label key={slot} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.availableHours.includes(slot)}
                      onChange={(e) => handleTimeSlotChange(slot, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">{slot}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting && <LoadingSpinner size="sm" />}
                <span className={submitting ? "ml-2" : ""}>
                  {submitting 
                    ? (editingLab ? 'Updating...' : 'Adding...')
                    : (editingLab ? 'Update Laboratory' : 'Add Laboratory')
                  }
                </span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={submitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Labs List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {labs.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Laboratories</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first laboratory.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Laboratory
            </button>
          </div>
        ) : (
          labs.map((lab) => (
            <div key={lab.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Cpu className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{lab.name}</h3>
                    <p className="text-sm text-gray-600">{lab.type} - Floor {lab.floor}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(lab)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    disabled={submitting}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(lab.id!)}
                    className="text-red-600 hover:text-red-900 p-1 rounded"
                    disabled={submitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {lab.capacity} students</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Equipment:</p>
                  <div className="flex flex-wrap gap-1">
                    {lab.equipment.slice(0, 3).map((equipment) => (
                      <span
                        key={equipment}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <Wrench className="h-3 w-3 mr-1" />
                        {equipment}
                      </span>
                    ))}
                    {lab.equipment.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        +{lab.equipment.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Available Hours:</p>
                  <div className="flex flex-wrap gap-1">
                    {lab.availableHours.map((hour) => (
                      <span
                        key={hour}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {hour}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LabManagement;