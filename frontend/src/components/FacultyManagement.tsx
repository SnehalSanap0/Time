import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User, Mail, Phone, BookOpen, AlertCircle } from 'lucide-react';
import { useTimetableData } from '../hooks/useTimetableData';
import { Faculty } from '../types/timetable';
import { LoadingSpinner } from './LoadingSpinner';

const FacultyManagement = () => {
  const { 
    faculty, 
    loading, 
    error, 
    addFaculty, 
    updateFaculty, 
    deleteFaculty,
    clearError 
  } = useTimetableData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    subjects: [] as string[],
    maxHoursPerDay: 4,
    preferredSlots: [] as string[],
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      subjects: [],
      maxHoursPerDay: 4,
      preferredSlots: [],
    });
    setEditingFaculty(null);
    setShowAddForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (editingFaculty) {
        await updateFaculty(editingFaculty.id!, formData);
      } else {
        await addFaculty(formData);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving faculty:', err);
      // Error is already handled in the hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (facultyMember: Faculty) => {
    setFormData({
      name: facultyMember.name,
      email: facultyMember.email,
      phone: facultyMember.phone,
      department: facultyMember.department,
      subjects: facultyMember.subjects,
      maxHoursPerDay: facultyMember.maxHoursPerDay,
      preferredSlots: facultyMember.preferredSlots,
    });
    setEditingFaculty(facultyMember);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      try {
        await deleteFaculty(id);
      } catch (err) {
        console.error('Error deleting faculty:', err);
        // Error is already handled in the hook
      }
    }
  };

  const handleSubjectChange = (subject: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, subjects: [...formData.subjects, subject] });
    } else {
      setFormData({ ...formData, subjects: formData.subjects.filter(s => s !== subject) });
    }
  };

  const handleSlotChange = (slot: string, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, preferredSlots: [...formData.preferredSlots, slot] });
    } else {
      setFormData({ ...formData, preferredSlots: formData.preferredSlots.filter(s => s !== slot) });
    }
  };

  const availableSubjects = ['DBMS', 'Software Engineering', 'Machine Learning', 'Data Structures', 'Web Development', 'AI', 'Computer Networks', 'Operating Systems'];
  const timeSlots = ['Morning (8-12)', 'Afternoon (12-4)', 'Evening (4-6)'];

  if (loading) {
    return <LoadingSpinner text="Loading faculty data..." />;
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
          <h2 className="text-2xl font-bold text-gray-900">Faculty Management</h2>
          <p className="text-gray-600 mt-1">
            Manage faculty information, subject assignments, and scheduling preferences
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Faculty</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subjects (can teach)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {availableSubjects.map((subject) => (
                  <label key={subject} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={(e) => handleSubjectChange(subject, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={submitting}
                    />
                    <span className="text-sm text-gray-700">{subject}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Hours Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={formData.maxHoursPerDay}
                  onChange={(e) => setFormData({ ...formData, maxHoursPerDay: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time Slots
                </label>
                <div className="space-y-2">
                  {timeSlots.map((slot) => (
                    <label key={slot} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.preferredSlots.includes(slot)}
                        onChange={(e) => handleSlotChange(slot, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <span className="text-sm text-gray-700">{slot}</span>
                    </label>
                  ))}
                </div>
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
                    ? (editingFaculty ? 'Updating...' : 'Adding...')
                    : (editingFaculty ? 'Update Faculty' : 'Add Faculty')
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

      {/* Faculty List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {faculty.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Faculty Members</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first faculty member.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Faculty
            </button>
          </div>
        ) : (
          faculty.map((facultyMember) => (
            <div key={facultyMember.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{facultyMember.name}</h3>
                    <p className="text-sm text-gray-600">{facultyMember.department}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(facultyMember)}
                    className="text-blue-600 hover:text-blue-900 p-1 rounded"
                    disabled={submitting}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(facultyMember.id!)}
                    className="text-red-600 hover:text-red-900 p-1 rounded"
                    disabled={submitting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{facultyMember.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{facultyMember.phone}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Subjects:</p>
                  <div className="flex flex-wrap gap-1">
                    {facultyMember.subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Hours/Day:</span>
                  <span className="font-medium">{facultyMember.maxHoursPerDay} hours</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Preferred Slots:</p>
                  <div className="flex flex-wrap gap-1">
                    {facultyMember.preferredSlots.map((slot) => (
                      <span
                        key={slot}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {slot}
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

export default FacultyManagement;