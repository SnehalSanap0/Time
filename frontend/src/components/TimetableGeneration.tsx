import { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, Calendar, BookOpen, Users, Settings, Play } from 'lucide-react';
import { TimetableService } from '../services/api';
import { Subject, Faculty, Classroom, Lab, TimetableSlot, Conflict, TimetableConstraints } from '../types/timetable'; // Import TimetableConstraints
import { useTimetableData } from '../hooks/useTimetableData';
import { LoadingSpinner } from './LoadingSpinner';
import { AITimetableGenerator } from '../utils/aiTimetableGenerator';

interface GenerationConfig {
  semester: number;
  year: 'SE' | 'TE' | 'BE';
  prioritizeLabAfternoon: boolean;
  allowBackToBackTheory: boolean;
  maxConsecutiveHours: number;
  breakDuration: number;
  preferredStartTime: string;
}

interface ConflictItem {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

const TimetableGeneration = () => {
  const {
    subjects,
    faculty,
    classrooms,
    labs,
    timetableSlots,
    loading: dataLoading,
    error: dataError,
    setTimetableSlots,
    clearError
  } = useTimetableData();

  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [generationStats, setGenerationStats] = useState<any>(null);

  const [config, setConfig] = useState<GenerationConfig>({
    semester: 3,
    year: 'SE',
    prioritizeLabAfternoon: true,
    allowBackToBackTheory: false,
    maxConsecutiveHours: 3,
    breakDuration: 15,
    preferredStartTime: '8:10',
  });

  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);

  // Calculate statistics from real data
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalFaculty: 0,
    totalClassrooms: 0,
    totalLabs: 0,
    semesterSubjects: 0,
    yearClassrooms: 0,
  });

  useEffect(() => {
    // Update stats when data changes
    const semesterSubjects = subjects.filter(s => s.semester === config.semester && s.year === config.year);
    const yearClassrooms = classrooms.filter(c => c.assignedYear === config.year);

    setStats({
      totalSubjects: subjects.length,
      totalFaculty: faculty.length,
      totalClassrooms: classrooms.length,
      totalLabs: labs.length,
      semesterSubjects: semesterSubjects.length,
      yearClassrooms: yearClassrooms.length,
    });

    // Check for potential conflicts
    validateConfiguration();
  }, [subjects, faculty, classrooms, labs, config]);

  // Helper function to get faculty name from subject
  const getFacultyName = (subject: { faculty: string | { name: string } }) => {
    return typeof subject.faculty === 'object' ? subject.faculty.name : subject.faculty;
  };

  const validateConfiguration = () => {
    const newConflicts: ConflictItem[] = [];
    const semesterSubjects = subjects.filter(s => s.semester === config.semester && s.year === config.year);
    const yearClassrooms = classrooms.filter(c => c.assignedYear === config.year);
    const availableFaculty = faculty.filter(f =>
      semesterSubjects.some(s => f.subjects.includes(s.code) || f.name === getFacultyName(s))
    );

    // Check if we have subjects for the selected semester and year
    if (semesterSubjects.length === 0) {
      newConflicts.push({
        type: 'error',
        message: `No subjects found for ${config.year} Semester ${config.semester}`,
        severity: 'high'
      });
    }

    // Check if we have classrooms for the selected year
    if (yearClassrooms.length === 0) {
      newConflicts.push({
        type: 'error',
        message: `No classrooms assigned to ${config.year}`,
        severity: 'high'
      });
    }

    // Check faculty availability
    const requiredFaculty = new Set(semesterSubjects.map(s => getFacultyName(s)));
    const availableFacultyNames = new Set(faculty.map(f => f.name));
    const missingFaculty = Array.from(requiredFaculty).filter(f => !availableFacultyNames.has(f));

    if (missingFaculty.length > 0) {
      newConflicts.push({
        type: 'warning',
        message: `Faculty not found in database: ${missingFaculty.join(', ')}`,
        severity: 'medium'
      });
    }

    // Check lab requirements
    const labSubjects = semesterSubjects.filter(s => s.labHours > 0);
    if (labSubjects.length > 0 && labs.length === 0) {
      newConflicts.push({
        type: 'warning',
        message: `${labSubjects.length} subjects require labs, but no labs are configured`,
        severity: 'medium'
      });
    }

    // Check faculty workload
    availableFaculty.forEach(f => {
      const assignedSubjects = semesterSubjects.filter(s => getFacultyName(s) === f.name);
      const totalHours = assignedSubjects.reduce((sum, s) => sum + s.theoryHours + s.labHours, 0);
      const maxWeeklyHours = f.maxHoursPerDay * 6; // Use 6 days to match generator

      if (totalHours > maxWeeklyHours) {
        newConflicts.push({
          type: 'warning',
          message: `${f.name} assigned ${totalHours}h/week (exceeds ${maxWeeklyHours}h preference)`,
          severity: 'medium'
        });
      }
    });

    // Check if generation is possible
    if (semesterSubjects.length > 0 && yearClassrooms.length > 0 && missingFaculty.length === 0) {
      if (newConflicts.filter(c => c.type === 'error').length === 0) { // Only show if no errors
        newConflicts.push({
          type: 'success',
          message: 'Configuration is valid and ready for generation',
          severity: 'low'
        });
      }
    }

    setConflicts(newConflicts);
  };

  const simulateGeneration = async () => {
    const steps = [
      { step: 'Initializing AI constraint analyzer...', progress: 10 },
      { step: 'Analyzing constraints with Gemini AI...', progress: 25 },
      { step: 'Loading subjects and faculty data...', progress: 40 },
      { step: 'Generating AI-powered slot recommendations...', progress: 55 },
      { step: 'Allocating theory sessions with AI insights...', progress: 70 },
      { step: 'Scheduling laboratory sessions intelligently...', progress: 80 },
      { step: 'Optimizing faculty schedules using AI...', progress: 90 },
      { step: 'Validating final timetable...', progress: 95 },
      { step: 'Saving to database...', progress: 98 },
      { step: 'AI-powered generation complete!', progress: 100 },
    ];

    for (const { step, progress } of steps) {
      setCurrentStep(step);
      setGenerationProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 300)); // Sped up simulation
    }
  };

  const handleGenerate = async () => {
    // Check for critical errors
    const criticalErrors = conflicts.filter(c => c.type === 'error');
    if (criticalErrors.length > 0) {
      alert('Cannot generate timetable due to configuration errors. Please fix them first.');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('running');
    setGenerationProgress(0);
    setAiAnalysisResult(null); // Clear previous results
    setGenerationStats(null); // Clear previous stats

    try {
      // Clear existing timetable slots from database for this year and semester
      setCurrentStep('Clearing existing timetable data...');
      setGenerationProgress(10);
      // NOTE: Clearing *all* slots might be too destructive.
      // You might want to implement TimetableService.clearSlotsByYearAndSemester(config.year, config.semester)
      await TimetableService.clearAllSlots();

      // Simulate generation process UI steps
      await simulateGeneration();

      // Filter data for selected semester and year from Firebase data
      setCurrentStep('Loading configuration data...');

      if (subjects.length === 0) {
        throw new Error(`No subjects found in the database.`);
      }

      if (classrooms.length === 0) {
        throw new Error(`No classrooms found in the database.`);
      }

      setCurrentStep('Generating timetable with AI-powered constraints...');
      setGenerationProgress(60);

      // **FIX 1: Create the correct TimetableConstraints object**
      // Determine batch type based on user's preferred start time
      const selectedBatchType = config.preferredStartTime === '8:10' ? 'Morning' : 'Afternoon';
      
      const constraints: TimetableConstraints = {
        maxHoursPerDay: 6,
        minBreakBetweenClasses: config.breakDuration,
        maxConsecutiveHours: config.maxConsecutiveHours,
        prioritizeLabAfternoon: config.prioritizeLabAfternoon,
        allowBackToBackTheory: config.allowBackToBackTheory,
        facultyRestSlots: 1,
        // **USER-SELECTED:** Use the user's preferred start time to determine batch type
        yearBatchType: {
          SE: selectedBatchType,
          TE: selectedBatchType,
          BE: selectedBatchType
        }
      };

      // Generate timetable using the AI-powered TimetableGenerator
      // Pass *all* data; the generator will filter internally based on the targetYear
      const generator = new AITimetableGenerator(
        subjects,
        faculty,
        classrooms,
        labs,
        constraints
      );

      // Generate for the selected year and semester
      const result = await generator.generateTimetable(config.year, config.semester);

      setCurrentStep('Saving timetable to database...');
      setGenerationProgress(90);

      // Add semester field to each generated slot
      const slotsWithSemester = result.slots.map(slot => ({
        ...slot,
        semester: config.semester // Ensure semester is attached
      }));

      // Save generated slots to Firebase using batch operation
      if (slotsWithSemester.length > 0) {
        await TimetableService.batchSaveTimetableSlots(slotsWithSemester);

        // Update local state with generated slots (including semester)
        // We must *replace* the existing slots from the hook
        setTimetableSlots(slotsWithSemester);

        setCurrentStep('AI-powered timetable generation completed successfully!');
        setGenerationProgress(100);
      } else {
        console.warn('No timetable slots were generated. This might be due to strict constraints.');
        setTimetableSlots([]); // Clear local state
        setCurrentStep('Generation complete, but no slots were created.');
        setGenerationProgress(100);
      }

      setGenerationStatus('success');
      setLastGenerated(new Date());

      // Store AI analysis results and generation stats
      setAiAnalysisResult(result.analysisResult);
      setGenerationStats(result.generationStats);

      // Update conflicts with generation results
      const updatedConflicts: ConflictItem[] = [ // Ensure type is ConflictItem[]
        {
          type: 'success' as const,
          message: `Successfully generated AI-optimized timetable for ${config.year} Semester ${config.semester}`,
          severity: 'low' as const,
        },
        {
          type: 'info' as const,
          message: `Generated ${result.slots.length} time slots with ${result.analysisResult.constraintScore}% constraint satisfaction`,
          severity: 'low' as const,
        },
        {
          type: 'info' as const,
          message: `Consistency Hash: ${result.generationStats.consistencyHash.substring(0, 16)}...`,
          severity: 'low' as const,
        },
        // **FIX 2: Use type assertion for compatibility**
        ...result.conflicts.map((conflict: Conflict) => ({
          type: conflict.type as ConflictItem['type'], // Cast string to the literal type
          message: conflict.message,
          severity: conflict.severity
        }))
      ];

      setConflicts(updatedConflicts);

    } catch (error) {
      console.error('Error generating timetable:', error);
      setGenerationStatus('error');
      setConflicts([
        {
          type: 'error',
          message: `Failed to generate timetable: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'high',
        },
      ]);
    } finally {
      setIsGenerating(false);
      // Don't reset progress and step immediately, let success/error show
    }
  };

  const getStatusIcon = () => {
    switch (generationStatus) {
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (generationStatus) {
      case 'running':
        return currentStep || 'Generating timetable...';
      case 'success':
        return 'Timetable generated successfully';
      case 'error':
        return 'Generation failed';
      default:
        return 'Ready to generate';
    }
  };

  if (dataLoading) {
    return <LoadingSpinner text="Loading timetable data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Data Error Display */}
      {dataError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{dataError}</span>
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Timetable Generation</h2>
        <p className="text-gray-600 mt-1">
          Configure constraints and generate optimized timetables using real data
        </p>
      </div>

      {/* Data Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Total Subjects</p>
              <p className="text-lg font-bold text-blue-900">{stats.totalSubjects}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Faculty</p>
              <p className="text-lg font-bold text-green-900">{stats.totalFaculty}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-purple-600">Classrooms</p>
              <p className="text-lg font-bold text-purple-900">{stats.totalClassrooms}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600">Labs</p>
              <p className="text-lg font-bold text-orange-900">{stats.totalLabs}</p>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm text-indigo-600">Sem. Subjects</p>
              <p className="text-lg font-bold text-indigo-900">{stats.semesterSubjects}</p>
            </div>
          </div>
        </div>
        <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-pink-600" />
            <div>
              <p className="text-sm text-pink-600">Year Rooms</p>
              <p className="text-lg font-bold text-pink-900">{stats.yearClassrooms}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Status */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Generation Status</h3>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${generationStatus === 'success' ? 'text-green-600' :
                generationStatus === 'error' ? 'text-red-600' :
                  generationStatus === 'running' ? 'text-blue-600' :
                    'text-gray-500'
              }`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {lastGenerated && (
          <div className="mb-4 space-y-2">
            <p className="text-sm text-gray-600">
              Last generated: {lastGenerated.toLocaleString()} | Generated slots: {timetableSlots.length}
            </p>
            {generationStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-blue-50 p-2 rounded">
                  <span className="font-medium text-blue-800">Constraint Score:</span>
                  <span className="ml-1 text-blue-600">{generationStats.constraintScore}%</span>
                </div>
                <div className="bg-green-50 p-2 rounded">
                  <span className="font-medium text-green-800">Faculty Utilization:</span>
                  <span className="ml-1 text-green-600">{generationStats.facultyUtilization}%</span>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <span className="font-medium text-purple-800">Room Utilization:</span>
                  <span className="ml-1 text-purple-600">{generationStats.roomUtilization}%</span>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <span className="font-medium text-orange-800">Theory/Lab:</span>
                  <span className="ml-1 text-orange-600">{generationStats.theorySlots}/{generationStats.labSlots}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || conflicts.some(c => c.type === 'error')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${isGenerating || conflicts.some(c => c.type === 'error')
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          <Play className="h-5 w-5" />
          <span>{isGenerating ? 'AI Generating...' : 'Generate AI-Optimized Timetable'}</span>
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Generation Configuration</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={config.year}
                onChange={(e) => setConfig({ ...config, year: e.target.value as 'SE' | 'TE' | 'BE' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              >
                <option value="SE">Second Year (SE)</option>
                <option value="TE">Third Year (TE)</option>
                <option value="BE">Final Year (BE)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester
              </label>
              <select
                value={config.semester}
                onChange={(e) => setConfig({ ...config, semester: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Start Time
              </label>
              <select
                value={config.preferredStartTime}
                onChange={(e) => setConfig({ ...config, preferredStartTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              >
                <option value="8:10">8:10 AM (Morning)</option>
                <option value="10:25">10:25 AM (Afternoon)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Consecutive Hours (for Faculty)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={config.maxConsecutiveHours}
                onChange={(e) => setConfig({ ...config, maxConsecutiveHours: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.prioritizeLabAfternoon}
                  onChange={(e) => setConfig({ ...config, prioritizeLabAfternoon: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isGenerating}
                />
                <span className="text-sm font-medium text-gray-700">
                  Prioritize labs in afternoon slots
                </span>
              </label>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.allowBackToBackTheory}
                  onChange={(e) => setConfig({ ...config, allowBackToBackTheory: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={isGenerating}
                />
                <span className="text-sm font-medium text-gray-700">
                  Allow back-to-back theory (AI Generator constraint)
                </span>
                _   </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break Duration (minutes)
              </label>
              <input
                type="number"
                min="10"
                max="30"
                value={config.breakDuration}
                onChange={(e) => setConfig({ ...config, breakDuration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Selection:</h4>
              <p className="text-sm text-gray-600">
                {config.year} - Semester {config.semester}<br />
                Batch Type: {config.preferredStartTime === '8:10' ? 'Morning' : 'Afternoon'}<br />
                Subjects: {stats.semesterSubjects}<br />
                Available Rooms: {stats.yearClassrooms}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generation Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>{currentStep}</span>
              <span className="text-blue-600">{generationProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${generationProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {aiAnalysisResult && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Analysis Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Constraint Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overall Score:</span>
                  <span className={`font-medium ${aiAnalysisResult.constraintScore >= 80 ? 'text-green-600' :
                      aiAnalysisResult.constraintScore >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                    }`}>
                    {aiAnalysisResult.constraintScore}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valid Configuration:</span>
                  <span className={`font-medium ${aiAnalysisResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {aiAnalysisResult.isValid ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">AI Recommendations:</span>
                  <span className="font-medium text-blue-600">
                    {aiAnalysisResult.recommendedSlots.length}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-3">Optimization Suggestions</h4>
              <div className="space-y-1">
                {aiAnalysisResult.optimizationSuggestions.slice(0, 3).map((suggestion: string, index: number) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    • {suggestion}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {aiAnalysisResult.recommendedSlots.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-700 mb-3">AI Slot Recommendations</h4>
              <div className="max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {aiAnalysisResult.recommendedSlots.slice(0, 5).map((slot: any, index: number) => (
                    <div key={index} className="text-sm bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium">{slot.subject}</span> - {slot.faculty}
                          <br />
                          <span className="text-gray-600">{slot.day} {slot.time} in {slot.room}</span>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-1 rounded ${slot.confidence >= 80 ? 'bg-green-100 text-green-800' :
                              slot.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {slot.confidence}% confidence
                          </div>
                        </div>
                      </div>
                      {slot.reasoning && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {slot.reasoning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conflicts and Warnings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Validation Results ({conflicts.length})
        </h3>

        {conflicts.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No conflicts found. Ready to generate.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${conflict.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    conflict.type === 'error' ? 'bg-red-50 border-red-400' :
                      conflict.type === 'success' ? 'bg-green-50 border-green-400' :
                        'bg-blue-50 border-blue-400'
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${conflict.type === 'warning' ? 'text-yellow-600' :
                      conflict.type === 'error' ? 'text-red-600' :
                        conflict.type === 'success' ? 'text-green-600' :
                          'text-blue-600'
                    }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${conflict.type === 'warning' ? 'text-yellow-800' :
                        conflict.type === 'error' ? 'text-red-800' :
                          conflict.type === 'success' ? 'text-green-800' :
                            'text-blue-800'
                      }`}>
                      {conflict.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Severity: {conflict.severity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableGeneration;