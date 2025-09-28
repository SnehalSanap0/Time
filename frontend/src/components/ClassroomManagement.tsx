import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Building, Users, MapPin, Settings, AlertCircle } from 'lucide-react';
import { useTimetableData } from '../hooks/useTimetableData';
import { Classroom } from '../types/timetable';
import { LoadingSpinner } from './LoadingSpinner';

const ClassroomManagement = () => {
  const { 
    classrooms, 
    loading, 
    error, 
    addClassroom, 
    updateClassroom, 
    deleteClassroom,
    clearError 
  } = useTimetableData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 90,
    timeSlot: '8AM-3PM' as '8AM-3PM' | '10AM-5PM',
    assignedYear: 'SE' as 'SE' | 'TE' | 'BE',
    floor: 1,
    amenities: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 90,
      timeSlot: '8AM-3PM',
      assignedYear: 'SE',
      floor: 1,
      amenities: [],
    });
    setEditingClassroom(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingClassroom) {
        await updateClassroom(editingClassroom.id!, formData);
      } else {
        await addClassroom(formData);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving classroom:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (classroom: Classroom) => {
    setFormData({
      name: classroom.name,
      capacity: classroom.capacity,
      timeSlot: classroom.timeSlot,
      assignedYear: classroom.assignedYear,
      floor: classroom.floor,
      amenities: classroom.amenities,
    });
    setEditingClassroom(classroom);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this classroom?')) {
      try {
        await deleteClassroom(id);
      } catch (err) {
        console.error('Error deleting classroom:', err);
      }
    }
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
    } else {
      setFormData({ ...formData, amenities: formData.amenities.filter(a => a !== amenity) });
    }
  };

  const availableAmenities = [
    'Projector', 'AC', 'Audio System', 'Smart Board', 
    'Whiteboard', 'WiFi', 'Power Outlets', 'Natural Light'
  ];

  const timeSlotOptions = [
    { value: '8AM-3PM', label: '8:00 AM - 3:00 PM' },
    { value: '10AM-5PM', label: '10:00 AM - 5:00 PM' },
  ];

  const yearOptions = [
    { value: 'SE', label: 'Second Year (SE)' },
    { value: 'TE', label: 'Third Year (TE)' },
    { value: 'BE', label: 'Final Year (BE)' },
  ];

  if (loading) {
    return <LoadingSpinner text="Loading classrooms..." />;
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
          <h2 className="text-2xl font-bold text-gray-900">Classroom Management</h2>
          <p className="text-gray-600 mt-1">
            Manage classroom capacity, amenities, and year assignments
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Classroom</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingClassroom ? 'Edit Classroom' : 'Add New Classroom'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                  placeholder="e.g., Room A-101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Slot
                </label>
                <select
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value as '8AM-3PM' | '10AM-5PM' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                >
                  {timeSlotOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Year
                </label>
                <select
                  value={formData.assignedYear}
                  onChange={(e) => setFormData({ ...formData, assignedYear: e.target.value as 'SE' | 'TE' | 'BE' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                >
                  {yearOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
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
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
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
                    ? (editingClassroom ? 'Updating...' : 'Adding...')
                    : (editingClassroom ? 'Update Classroom' : 'Add Classroom')
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

      {/* Classrooms List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {classrooms.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classrooms</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first classroom.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Classroom
            </button>
          </div>
        ) : (
          classrooms.map((classroom) => (
            <div key={classroom.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{classroom.name}</h3>
                    <p className="text-sm text-gray-600">Floor {classroom.floor}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(classroom)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    disabled={submitting}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(classroom.id!)}
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
                  <span>Capacity: {classroom.capacity} students</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Assigned to {classroom.assignedYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Time Slot:</span>
                  <span className="font-medium">{classroom.timeSlot}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {classroom.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {amenity}
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

export default ClassroomManagement;