import { useState } from 'react';
import { Brain, CheckCircle, AlertCircle, Zap, Target, BarChart3, Shield } from 'lucide-react';
import ConsistencyTest from '../utils/consistencyTest';
import ConstraintTest from '../utils/constraintTest';

const AIDemo = () => {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunningConstraintTest, setIsRunningConstraintTest] = useState(false);
  const [constraintTestResult, setConstraintTestResult] = useState<any>(null);

  const runConsistencyTest = async () => {
    setIsRunningTest(true);
    setTestResult(null);
    
    try {
      const result = await ConsistencyTest.testConsistency();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        isConsistent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const runConstraintTest = async () => {
    setIsRunningConstraintTest(true);
    setConstraintTestResult(null);
    
    try {
      const result = await ConstraintTest.testConstraintEnforcement();
      setConstraintTestResult(result);
    } catch (error) {
      setConstraintTestResult({
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunningConstraintTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">AI-Powered Timetable Generation</h2>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Experience intelligent timetable generation powered by Google's Gemini AI. 
          Our system analyzes constraints in real-time and generates optimized schedules with guaranteed consistency.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI Constraint Analysis</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Gemini AI analyzes complex scheduling constraints including faculty availability, 
            room capacity, and student conflicts to provide intelligent recommendations.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Intelligent Slot Assignment</h3>
          </div>
          <p className="text-gray-600 text-sm">
            AI provides specific slot recommendations with confidence scores, 
            optimizing for faculty preferences and resource utilization.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Consistent Generation</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Identical inputs always produce identical outputs using deterministic hashing 
            and intelligent caching mechanisms.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Real-time Optimization</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Continuous analysis and optimization of faculty workload, 
            room utilization, and scheduling efficiency.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Fallback Support</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Graceful fallback to traditional generation if AI is unavailable, 
            ensuring system reliability and availability.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
          </div>
          <p className="text-gray-600 text-sm">
            Comprehensive statistics including constraint satisfaction scores, 
            utilization metrics, and consistency verification.
          </p>
        </div>
      </div>

      {/* Constraint Enforcement Test Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Constraint Enforcement Test</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Test that the system properly enforces critical constraints: max 3 theory sessions per subject, 
          no consecutive sessions, proper lab batch distribution (A, B, C), and no duplicate lab sessions.
        </p>

        <button
          onClick={runConstraintTest}
          disabled={isRunningConstraintTest}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRunningConstraintTest
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>{isRunningConstraintTest ? 'Testing Constraints...' : 'Test Constraint Enforcement'}</span>
        </button>

        {constraintTestResult && (
          <div className="mt-4 p-4 rounded-lg border-l-4 bg-gray-50">
            {constraintTestResult.passed ? (
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">✅ Constraint Test PASSED</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">❌ Constraint Test FAILED</span>
              </div>
            )}
            
            <p className="text-sm text-gray-700 mt-2">{constraintTestResult.summary}</p>
            
            {constraintTestResult.error && (
              <p className="text-red-600 text-sm mt-2">Error: {constraintTestResult.error}</p>
            )}
            
            {constraintTestResult.violations && constraintTestResult.violations.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-800">Constraint violations found:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {constraintTestResult.violations.map((violation: string, index: number) => (
                    <li key={index}>{violation}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consistency Test Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Consistency Test</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Test that identical inputs produce identical outputs. This ensures reliable and predictable timetable generation.
        </p>

        <button
          onClick={runConsistencyTest}
          disabled={isRunningTest}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isRunningTest
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <CheckCircle className="h-4 w-4" />
          <span>{isRunningTest ? 'Running Test...' : 'Run Consistency Test'}</span>
        </button>

        {testResult && (
          <div className="mt-4 p-4 rounded-lg border-l-4 bg-gray-50">
            {testResult.isConsistent ? (
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">✅ Consistency Test PASSED</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">❌ Consistency Test FAILED</span>
              </div>
            )}
            
            {testResult.error && (
              <p className="text-red-600 text-sm mt-2">Error: {testResult.error}</p>
            )}
            
            {testResult.hash1 && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Hash 1: <code className="bg-gray-200 px-1 rounded">{testResult.hash1.substring(0, 16)}...</code></p>
                <p>Hash 2: <code className="bg-gray-200 px-1 rounded">{testResult.hash2.substring(0, 16)}...</code></p>
              </div>
            )}
            
            {testResult.differences && testResult.differences.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-800">Differences found:</p>
                <ul className="text-sm text-red-600 list-disc list-inside">
                  {testResult.differences.map((diff: string, index: number) => (
                    <li key={index}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 Quick Setup</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>1. Get your Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></p>
          <p>2. Set the environment variable: <code className="bg-blue-100 px-1 rounded">VITE_GEMINI_API_KEY=your-key</code></p>
          <p>3. Or edit <code className="bg-blue-100 px-1 rounded">frontend/src/config/gemini.ts</code></p>
          <p>4. Start generating AI-optimized timetables!</p>
        </div>
      </div>
    </div>
  );
};

export default AIDemo;
