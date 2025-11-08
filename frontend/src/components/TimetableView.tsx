import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, Eye, Users, BookOpen } from 'lucide-react';
import { useTimetableData } from '../hooks/useTimetableData';
import { TimetableService } from '../services/api';
import { TimetableSlot } from '../types/timetable';
import { LoadingSpinner } from './LoadingSpinner';

// **FIX 1: Add time parsing helpers**
/**
 * Parses a time string (e.g., "8:10" or "10:25") into a number (810 or 1025).
 */
const parseTime = (timeStr: string): number => {
  return parseInt(timeStr.replace(':', ''), 10);
};

/**
 * Checks if a slot's time is fully contained within a row's time.
 * @param slotTime (e.g., "8:10-9:10")
 * @param rowTime (e.g., "8:10-10:10")
 * @returns boolean
 */
const isSlotInRow = (slotTime: string, rowTime: string): boolean => {
  try {
    const [slotStart, slotEnd] = slotTime.split('-').map(parseTime);
    const [rowStart, rowEnd] = rowTime.split('-').map(parseTime);

    // Check for containment: rowStart <= slotStart AND slotEnd <= rowEnd
    return rowStart <= slotStart && slotEnd <= rowEnd;
  } catch (e) {
    console.error("Error parsing time in isSlotInRow:", slotTime, rowTime, e);
    return false;
  }
};


const TimetableView = () => {
  // useTimetableData provides *all* timetable slots, not just generated ones
  const { faculty, timetableSlots: allSlotsFromHook, loading: dataLoading, error: dataError } = useTimetableData();

  const [viewType, setViewType] = useState<'year' | 'batch' | 'faculty'>('year');
  const [selectedYear, setSelectedYear] = useState<'SE' | 'TE' | 'BE'>('SE');
  const [selectedSemester, setSelectedSemester] = useState(3);
  const [selectedBatch, setSelectedBatch] = useState<'A' | 'B' | 'C'>('A');
  const [selectedFaculty, setSelectedFaculty] = useState('');

  // This state will hold the *filtered* data for the view
  const [timetableData, setTimetableData] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(false); // Local loading for filtering
  const [error, setError] = useState<string | null>(null);

  // Set default faculty when faculty data loads
  useEffect(() => {
    if (faculty.length > 0 && !selectedFaculty) {
      setSelectedFaculty(faculty[0].name);
    }
  }, [faculty, selectedFaculty]);

  // **FIX 2: Refactored data loading logic**
  // This useEffect now filters the data from the hook instead of re-fetching
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      let slots: TimetableSlot[] = [];

      // Filter slots from the main hook based on year and semester first
      const yearSemSlots = allSlotsFromHook.filter(
        s => s.year === selectedYear && s.semester === selectedSemester
      );

      switch (viewType) {
        case 'year':
          // 'Year' view shows only theory slots (which have no batch)
          slots = yearSemSlots.filter(s => s.type === 'theory' && !s.batch);
          break;

        case 'batch':
          // 'Batch' view shows theory (no batch) + labs for the selected batch
          slots = yearSemSlots.filter(s =>
            (s.type === 'theory' && !s.batch) || (s.type === 'lab' && s.batch === selectedBatch)
          );
          break;

        case 'faculty':
          // 'Faculty' view shows all slots for that faculty in the year/sem
          if (selectedFaculty) {
            slots = yearSemSlots.filter(s => s.faculty === selectedFaculty);
          }
          break;
      }

      setTimetableData(slots);
    } catch (err) {
      console.error('Error filtering timetable data:', err);
      setError(err instanceof Error ? err.message : 'Failed to filter timetable data');
    } finally {
      setLoading(false);
    }
  }, [viewType, selectedYear, selectedSemester, selectedBatch, selectedFaculty, allSlotsFromHook]);

  // This is the visual structure of the table rows
  const timeSlots = [
    '8:10-10:10',   // Row 1 (Spans 2 theory slots)
    '10:10-10:25',  // Break
    '10:25-12:15',  // Row 2 (Spans 2 theory slots)
    '12:15-1:05',   // Lunch break
    '1:05-2:55',    // Row 3 (Spans 2 theory slots)
    '2:55-3:05',    // Break
    '3:05-4:55'     // Row 4 (Spans 2 theory slots)
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // **FIX 3: Updated function to find all slots that fit in the row**
  const getMultipleSlotsForTimeAndDay = (rowTime: string, day: string): TimetableSlot[] => {
    return timetableData.filter(slot =>
      slot.day === day && isSlotInRow(slot.time, rowTime)
    );
  };

  const renderTimetableGrid = () => {
    // Use the hook's loading status
    if (dataLoading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <LoadingSpinner text="Loading timetable data..." />
        </div>
      );
    }

    if (error) { // Show local filter error
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error loading timetable</div>
            <div className="text-gray-600 text-sm">{error}</div>
          </div>
        </div>
      );
    }

    if (timetableData.length === 0 && !loading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-600 mb-2">No timetable data found</div>
            <div className="text-gray-500 text-sm">
              No data matches the current filter (Year: {selectedYear}, Sem: {selectedSemester})
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-700 w-32">
                  Time
                </th>
                {days.map((day) => (
                  <th key={day} className="border border-gray-200 px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {timeSlots.map((time) => (
                <tr key={time} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-25 align-top">
                    {time}
                  </td>
                  {days.map((day) => {
                    // **FIX 4: Use the corrected function here**
                    const slots = getMultipleSlotsForTimeAndDay(time, day);

                    // Sort slots to show theory first or by time
                    slots.sort((a, b) => parseTime(a.time.split('-')[0]) - parseTime(b.time.split('-')[0]));

                    return (
                      <td key={`${day}-${time}`} className="border border-gray-200 px-2 py-2 align-top h-24">
                        {time === '10:10-10:25' || time === '12:15-1:05' || time === '2:55-3:05' ? (
                          <div className="p-2 rounded-lg text-xs bg-gray-100 text-gray-600 h-full flex items-center justify-center">
                            <div className="font-medium text-center">
                              {time === '10:10-10:25' ? 'Break' :
                                time === '12:15-1:05' ? 'Lunch' : 'Break'}
                            </div>
                          </div>
                        ) : slots.length > 0 ? (
                          <div className="space-y-1">
                            {slots.map((slot, index) => (
                              <div key={index} className={`p-2 rounded-lg text-xs ${slot.type === 'lab'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                <div className="font-medium">{slot.subject}</div>
                                <div className="text-gray-600 mt-1">{slot.faculty}</div>
                                <div className="text-gray-500">{slot.room} ({slot.time})</div>
                                {slot.batch && (
                                  <div className="text-green-600 font-medium">Batch {slot.batch}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-2 text-center text-gray-400 text-xs">Free</div>
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

  // This is the main data loading check for the *hook*
  if (dataLoading) {
    return <LoadingSpinner text="Loading application data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Data Error Display from Hook */}
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
              <option value="year">Year-wise (Theory)</option>
              <option value="batch">Batch-wise (Labs)</option>
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
              {viewType === 'year' && `${selectedYear} Semester ${selectedSemester} - Theory Classes (All Batches)`}
              {viewType === 'batch' && `${selectedYear}-${selectedBatch} Semester ${selectedSemester} - Complete Schedule`}
              {viewType === 'faculty' && `${selectedFaculty} - Teaching Schedule (${selectedYear} Sem ${selectedSemester})`}
            </h3>
            <p className="text-sm text-gray-600">
              {viewType === 'year' && 'Shows theory lectures for the entire year from database'}
              {viewType === 'batch' && 'Shows both theory and lab sessions for selected batch from database'}
              {viewType === 'faculty' && 'Shows all assigned classes and labs from database'}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Showing {timetableData.length} scheduled slots from local state
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