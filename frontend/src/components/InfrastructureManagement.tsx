import React, { useState } from 'react';
import { Building, Clock, Users, MapPin, Settings, Cpu, Wrench, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import { useTimetableData } from '../hooks/useTimetableData';
import { LoadingSpinner } from './LoadingSpinner';

const InfrastructureManagement = () => {
  const { 
    classrooms, 
    labs, 
    loading, 
    error,
    addClassroom,
    addLab,
    updateClassroom,
    updateLab,
    deleteClassroom,
    deleteLab,
    clearError 
  } = useTimetableData();

  const [activeTab, setActiveTab] = useState<'classrooms' | 'labs'>('classrooms');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data for classroom
  const [classroomFormData, setClassroomFormData] = useState({
    name: '',
    capacity: 90,
    timeSlot: '8AM-3PM' as '8AM-3PM' | '10AM-5PM',
    assignedYear: 'SE' as 'SE' | 'TE' | 'BE',
    floor: 1,
    amenities: [] as string[],
  });

  // Form data for lab
  const [labFormData, setLabFormData] = useState({
    name: '',
    capacity: 30,
    type: '',
    equipment: [] as string[],
    floor: 1,
    availableHours: [] as string[],
  });

  const resetForms = () => {
    setClassroomFormData({
      name: '',
      capacity: 90,
      timeSlot: '8AM-3PM',
      assignedYear: 'SE',
      floor: 1,
      amenities: [],
    });
    setLabFormData({
      name: '',
      capacity: 30,
      type: '',
      equipment: [],
      floor: 1,
      availableHours: [],
    });
    setEditingItem(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (activeTab === 'classrooms') {
        if (editingItem) {
          await updateClassroom(editingItem.id!, classroomFormData);
        } else {
          await addClassroom(classroomFormData);
        }
      } else {
        if (editingItem) {
          await updateLab(editingItem.id!, labFormData);
        } else {
          await addLab(labFormData);
        }
      }
      resetForms();
    } catch (err) {
      console.error('Error saving item:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: any) => {
    if (activeTab === 'classrooms') {
      setClassroomFormData({
        name: item.name,
        capacity: item.capacity,
        timeSlot: item.timeSlot,
        assignedYear: item.assignedYear,
        floor: item.floor,
        amenities: item.amenities,
      });
    } else {
      setLabFormData({
        name: item.name,
        capacity: item.capacity,
        type: item.type,
        equipment: item.equipment,
        floor: item.floor,
        availableHours: item.availableHours || [],
      });
    }
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    const itemType = activeTab === 'classrooms' ? 'classroom' : 'laboratory';
    if (window.confirm(`Are you sure you want to delete this ${itemType}?`)) {
      try {
        if (activeTab === 'classrooms') {
          await deleteClassroom(id);
        } else {
          await deleteLab(id);
        }
      } catch (err) {
        console.error('Error deleting item:', err);
      }
    }
  };

  const handleClassroomAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setClassroomFormData({ ...classroomFormData, amenities: [...classroomFormData.amenities, amenity] });
    } else {
      setClassroomFormData({ ...classroomFormData, amenities: classroomFormData.amenities.filter(a => a !== amenity) });
    }
  };

  const handleLabEquipmentChange = (equipment: string, checked: boolean) => {
    if (checked) {
      setLabFormData({ ...labFormData, equipment: [...labFormData.equipment, equipment] });
    } else {
      setLabFormData({ ...labFormData, equipment: labFormData.equipment.filter(e => e !== equipment) });
    }
  };

  const handleLabTimeSlotChange = (timeSlot: string, checked: boolean) => {
    if (checked) {
      setLabFormData({ ...labFormData, availableHours: [...labFormData.availableHours, timeSlot] });
    } else {
      setLabFormData({ ...labFormData, availableHours: labFormData.availableHours.filter(h => h !== timeSlot) });
    }
  };

  // Options for forms
  const availableAmenities = [
    'Projector', 'AC', 'Audio System', 'Smart Board', 
    'Whiteboard', 'WiFi', 'Power Outlets', 'Natural Light'
  ];

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

  const timeSlotOptions = [
    { value: '8AM-3PM', label: '8:00 AM - 3:00 PM' },
    { value: '10AM-5PM', label: '10:00 AM - 5:00 PM' },
  ];

  const yearOptions = [
    { value: 'SE', label: 'Second Year (SE)' },
    { value: 'TE', label: 'Third Year (TE)' },
    { value: 'BE', label: 'Final Year (BE)' },
  ];
 
  
  // Form data for classroom
 

  // Form data for lab
 

  if (loading) {
    return <LoadingSpinner text="Loading infrastructure..." />;
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
          <h2 className="text-2xl font-bold text-gray-900">Infrastructure Management</h2>
          <p className="text-gray-600 mt-1">
            Manage classrooms and laboratory facilities
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add {activeTab === 'classrooms' ? 'Classroom' : 'Laboratory'}</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? `Edit ${activeTab === 'classrooms' ? 'Classroom' : 'Laboratory'}` : `Add New ${activeTab === 'classrooms' ? 'Classroom' : 'Laboratory'}`}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'classrooms' ? (
              // Classroom Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Name
                    </label>
                    <input
                      type="text"
                      value={classroomFormData.name}
                      onChange={(e) => setClassroomFormData({ ...classroomFormData, name: e.target.value })}
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
                      value={classroomFormData.capacity}
                      onChange={(e) => setClassroomFormData({ ...classroomFormData, capacity: parseInt(e.target.value) })}
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
                      value={classroomFormData.timeSlot}
                      onChange={(e) => setClassroomFormData({ ...classroomFormData, timeSlot: e.target.value as '8AM-3PM' | '10AM-5PM' })}
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
                      value={classroomFormData.assignedYear}
                      onChange={(e) => setClassroomFormData({ ...classroomFormData, assignedYear: e.target.value as 'SE' | 'TE' | 'BE' })}
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
                      value={classroomFormData.floor}
                      onChange={(e) => setClassroomFormData({ ...classroomFormData, floor: parseInt(e.target.value) })}
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
                          checked={classroomFormData.amenities.includes(amenity)}
                          onChange={(e) => handleClassroomAmenityChange(amenity, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={submitting}
                        />
                        <span className="text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              // Lab Form
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Laboratory Name
                    </label>
                    <input
                      type="text"
                      value={labFormData.name}
                      onChange={(e) => setLabFormData({ ...labFormData, name: e.target.value })}
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
                      value={labFormData.capacity}
                      onChange={(e) => setLabFormData({ ...labFormData, capacity: parseInt(e.target.value) })}
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
                      value={labFormData.type}
                      onChange={(e) => setLabFormData({ ...labFormData, type: e.target.value })}
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
                      value={labFormData.floor}
                      onChange={(e) => setLabFormData({ ...labFormData, floor: parseInt(e.target.value) })}
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
                          checked={labFormData.equipment.includes(equipment)}
                          onChange={(e) => handleLabEquipmentChange(equipment, e.target.checked)}
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
                          checked={labFormData.availableHours.includes(slot)}
                          onChange={(e) => handleLabTimeSlotChange(slot, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={submitting}
                        />
                        <span className="text-sm text-gray-700">{slot}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                <span className={submitting ? "ml-2" : ""}>
                  {submitting 
                    ? (editingItem ? 'Updating...' : 'Adding...')
                    : (editingItem ? `Update ${activeTab === 'classrooms' ? 'Classroom' : 'Laboratory'}` : `Add ${activeTab === 'classrooms' ? 'Classroom' : 'Laboratory'}`)
                  }
                </span>
              </button>
              <button
                type="button"
                onClick={resetForms}
                disabled={submitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('classrooms')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'classrooms'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Classrooms ({classrooms.length})
        </button>
        <button
          onClick={() => setActiveTab('labs')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'labs'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Laboratories ({labs.length})
        </button>
      </div>

      {/* Classrooms Tab */}
      {activeTab === 'classrooms' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div key={classroom.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
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
                      title="Edit classroom"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(classroom.id!)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      disabled={submitting}
                      title="Delete classroom"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacity:</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{classroom.capacity} students</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time Slot:</span>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{classroom.timeSlot}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Assigned Year:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      classroom.assignedYear === 'SE' ? 'bg-green-100 text-green-800' :
                      classroom.assignedYear === 'TE' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {classroom.assignedYear}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Amenities:</p>
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
      )}

      {/* Labs Tab */}
      {activeTab === 'labs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div key={lab.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
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
                      title="Edit laboratory"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(lab.id!)}
                      className="text-red-600 hover:text-red-900 p-1 rounded"
                      disabled={submitting}
                      title="Delete laboratory"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacity:</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium">{lab.capacity} students</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lab.type === 'Computer Lab' ? 'bg-blue-100 text-blue-800' :
                      lab.type === 'Specialized Lab' ? 'bg-purple-100 text-purple-800' :
                      lab.type === 'Research Lab' ? 'bg-orange-100 text-orange-800' :
                      lab.type === 'Development Lab' ? 'bg-emerald-100 text-emerald-800' :
                      lab.type === 'Hardware Lab' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lab.type}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Equipment:</p>
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
                  {lab.availableHours && lab.availableHours.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Available Hours:</p>
                      <div className="flex flex-wrap gap-1">
                        {lab.availableHours.slice(0, 2).map((hour) => (
                          <span
                            key={hour}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {hour}
                          </span>
                        ))}
                        {lab.availableHours.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{lab.availableHours.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-blue-100" />
            <div>
              <p className="text-blue-100 text-sm">Total Classrooms</p>
              <p className="text-3xl font-bold">{classrooms.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center space-x-3">
            <Cpu className="h-8 w-8 text-purple-100" />
            <div>
              <p className="text-purple-100 text-sm">Total Labs</p>
              <p className="text-3xl font-bold">{labs.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-green-100" />
            <div>
              <p className="text-green-100 text-sm">Classroom Capacity</p>
              <p className="text-3xl font-bold">
                {classrooms.reduce((sum, c) => sum + c.capacity, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center space-x-3">
            <Wrench className="h-8 w-8 text-orange-100" />
            <div>
              <p className="text-orange-100 text-sm">Lab Capacity</p>
              <p className="text-3xl font-bold">
                {labs.reduce((sum, l) => sum + l.capacity, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Infrastructure Stats */}
      {(classrooms.length > 0 || labs.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Infrastructure Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Classroom Distribution by Year */}
            {classrooms.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Classroom Distribution</h4>
                <div className="space-y-2">
                  {['SE', 'TE', 'BE'].map((year) => {
                    const count = classrooms.filter(c => c.assignedYear === year).length;
                    return (
                      <div key={year} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{year} Classrooms:</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lab Types Distribution */}
            {labs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Lab Types</h4>
                <div className="space-y-2">
                  {Array.from(new Set(labs.map(l => l.type))).map((type) => {
                    const count = labs.filter(l => l.type === type).length;
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{type}:</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Floor Distribution */}
            {(classrooms.length > 0 || labs.length > 0) && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Floor Distribution</h4>
                <div className="space-y-2">
                  {Array.from(new Set([...classrooms.map(c => c.floor), ...labs.map(l => l.floor)])).sort().map((floor) => {
                    const classroomCount = classrooms.filter(c => c.floor === floor).length;
                    const labCount = labs.filter(l => l.floor === floor).length;
                    return (
                      <div key={floor} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Floor {floor}:</span>
                        <span className="text-sm font-medium">{classroomCount + labCount} rooms</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfrastructureManagement;