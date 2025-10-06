// Replace the TimetableView component with this updated version that uses Firebase data

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Filter, Download, Eye, Users, BookOpen, RefreshCw } from 'lucide-react';
import { useTimetableData } from '../hooks/useTimetableData';
import { TimetableSlot } from '../types/timetable';
import { LoadingSpinner } from './LoadingSpinner';

const TimetableView = () => {
  const { 
    faculty, 
    timetableSlots, 
    loading: dataLoading, 
    error: dataError,
    refreshTimetableSlots
  } = useTimetableData();
  
  const [viewType, setViewType] = useState<'year' | 'batch' | 'faculty'>('year');
  const [selectedYear, setSelectedYear] = useState<'SE' | 'TE' | 'BE'>('TE');
  const [selectedSemester, setSelectedSemester] = useState(3);
  const [selectedBatch, setSelectedBatch] = useState<'A' | 'B' | 'C'>('A');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  
  const [filteredTimetableData, setFilteredTimetableData] = useState<TimetableSlot[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Set default faculty when faculty data loads
  useEffect(() => {
    if (faculty.length > 0 && !selectedFaculty) {
      setSelectedFaculty(faculty[0].name);
    }
  }, [faculty, selectedFaculty]);

  const filterTimetableData = useCallback(() => {
    if (!selectedYear || (viewType === 'faculty' && !selectedFaculty)) {
      setFilteredTimetableData([]);
      return;
    }
    
    let filteredSlots: TimetableSlot[] = [];
    
    // First filter by year and semester
    const yearSemesterSlots = timetableSlots.filter(slot => 
      slot.year === selectedYear && slot.semester === selectedSemester
    );
    
    switch (viewType) {
      case 'year':
        // Show all theory classes + all lab sessions for the year
        filteredSlots = yearSemesterSlots; // Show everything for the year/semester
        break;
      case 'batch': {
        // Show theory classes (no batch) + lab sessions for selected batch
        const theorySlots = yearSemesterSlots.filter(slot => slot.type === 'theory');
        const labSlots = yearSemesterSlots.filter(slot => 
          slot.type === 'lab' && slot.batch === selectedBatch
        );
        filteredSlots = [...theorySlots, ...labSlots];
        break;
      }
      case 'faculty':
        // Show all slots assigned to selected faculty
        filteredSlots = yearSemesterSlots.filter(slot => slot.faculty === selectedFaculty);
        break;
    }
    
    setFilteredTimetableData(filteredSlots);
    setLastRefresh(new Date());
    
    // Debug: Log the filtered data
    console.log('Filtered timetable data:', filteredSlots);
    console.log('Lab slots:', filteredSlots.filter(slot => slot.type === 'lab'));
  }, [timetableSlots, selectedYear, selectedSemester, viewType, selectedBatch, selectedFaculty]);

  // Filter timetable data based on current selection
  useEffect(() => {
    filterTimetableData();
  }, [filterTimetableData]);

  const handleManualRefresh = async () => {
    // Refresh data from backend first, then filter
    await refreshTimetableSlots();
    filterTimetableData();
  };
  const timeSlots = [
    '8:00-9:00',
    '9:00-10:00',
    '10:00-10:15',
    '10:15-11:15',
    '11:15-12:15',
    '12:15-1:15',
    '1:15-2:15',
    '2:15-3:15',
    '3:15-4:15',
    '4:15-5:15',
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const getSlotForTimeAndDay = (time: string, day: string): TimetableSlot | null => {
    // Check for lab slots first (they should take priority in afternoon)
    const labSlot = filteredTimetableData.find((slot: TimetableSlot) => 
      slot.day === day && 
      slot.type === 'lab' && 
      slot.duration === 2 && 
      (
        // Check if current time slot is covered by a 2-hour lab
        (slot.time === '1:15-3:15' && (time === '1:15-2:15' || time === '2:15-3:15')) ||
        (slot.time === '3:15-5:15' && (time === '3:15-4:15' || time === '4:15-5:15'))
      )
    );
    
    if (labSlot) {
      console.log(`Lab slot found for ${day} ${time}:`, labSlot);
      return labSlot;
    }
    
    // Then try exact match for theory classes
    const exactMatch = filteredTimetableData.find((slot: TimetableSlot) => 
      slot.day === day && slot.time === time
    );
    
    if (exactMatch) {
      console.log(`Exact match found for ${day} ${time}:`, exactMatch);
      return exactMatch;
    }
    
    return null;
  };

  const renderTimetableGrid = () => {
    if (dataLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <LoadingSpinner text="Loading timetable data..." />
        </div>
      );
    }

    if (dataError) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error loading timetable</div>
            <div className="text-gray-600 text-sm">{dataError}</div>
            <button 
              onClick={handleManualRefresh}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (filteredTimetableData.length === 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 mb-2">No timetable data found</div>
            <div className="text-gray-500 text-sm">
              Generate a timetable for {selectedYear} Semester {selectedSemester} to view the schedule
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Time
                </th>
                {days.map((day) => (
                  <th key={day} className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-25">
                    {time}
                  </td>
                  {days.map((day) => {
                    const slot = getSlotForTimeAndDay(time, day);
                    return (
                      <td key={`${day}-${time}`} className="border border-gray-200 px-2 py-2">
                        {slot ? (
                          <div className={`p-2 rounded-lg text-xs ${
                            time === '10:00-10:15' || time === '12:15-1:15'
                              ? 'bg-gray-100 text-gray-600'
                              : slot.type === 'lab'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {time === '10:00-10:15' ? (
                              <div className="font-medium text-center">Break</div>
                            ) : time === '12:15-1:15' ? (
                              <div className="font-medium text-center">Lunch Break</div>
                            ) : (
                              <>
                                <div className="font-medium">{slot.subject}</div>
                                <div className="text-gray-600 mt-1">{slot.faculty}</div>
                                <div className="text-gray-500">{slot.room}</div>
                                {slot.batch && (
                                  <div className="text-green-600 font-medium">Batch {slot.batch}</div>
                                )}
                                {slot.duration === 2 && slot.time !== time && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    ({slot.time})
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 text-center text-gray-400 text-xs">
                            {time === '10:00-10:15' ? 'Break' : 
                             time === '12:15-1:15' ? 'Lunch' : 'Free'}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (dataLoading) {
    return <LoadingSpinner text="Loading application data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Data Error Display */}
      {dataError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-800">{dataError}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Timetable View</h2>
          <p className="text-gray-600 mt-1">
            View generated timetables from database
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleManualRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Eye className="h-4 w-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">View Options</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              View Type
            </label>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'year' | 'batch' | 'faculty')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="year">Year-wise (All Classes)</option>
              <option value="batch">Batch-wise (Specific Batch)</option>
              <option value="faculty">Faculty-wise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value as 'SE' | 'TE' | 'BE')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SE">Second Year (SE)</option>
              <option value="TE">Third Year (TE)</option>
              <option value="BE">Final Year (BE)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={1}>Semester 1</option>
              <option value={2}>Semester 2</option>
              <option value={3}>Semester 3</option>
              <option value={4}>Semester 4</option>
              <option value={5}>Semester 5</option>
              <option value={6}>Semester 6</option>
              <option value={7}>Semester 7</option>
              <option value={8}>Semester 8</option>
            </select>
          </div>

          {viewType === 'batch' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Batch
              </label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value as 'A' | 'B' | 'C')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="A">Batch A</option>
                <option value="B">Batch B</option>
                <option value="C">Batch C</option>
              </select>
            </div>
          )}

          {viewType === 'faculty' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Faculty
              </label>
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {faculty.map((f) => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Current View Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center space-x-3">
          {viewType === 'year' && <BookOpen className="h-5 w-5 text-blue-600" />}
          {viewType === 'batch' && <Users className="h-5 w-5 text-green-600" />}
          {viewType === 'faculty' && <Calendar className="h-5 w-5 text-purple-600" />}
          <div>
            <h3 className="font-semibold text-gray-900">
              {viewType === 'year' && `${selectedYear} Semester ${selectedSemester} - All Classes (Theory + All Lab Batches)`}
              {viewType === 'batch' && `${selectedYear}-${selectedBatch} Semester ${selectedSemester} - Complete Schedule`}
              {viewType === 'faculty' && `${selectedFaculty} - Teaching Schedule (${selectedYear} Sem ${selectedSemester})`}
            </h3>
            <p className="text-sm text-gray-600">
              {viewType === 'year' && 'Shows theory lectures and all lab sessions for all batches from database'}
              {viewType === 'batch' && 'Shows both theory and lab sessions for selected batch from database'}
              {viewType === 'faculty' && 'Shows all assigned classes and labs from database'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Showing {filteredTimetableData.length} scheduled slots | Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      {renderTimetableGrid()}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Legend</h4>
        <div className="flex space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-sm text-gray-600">Theory Class</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-sm text-gray-600">Lab Session</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <span className="text-sm text-gray-600">Break/Free Period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableView;