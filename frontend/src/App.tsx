import React, { useState, useEffect } from 'react';
import { Calendar, Users, BookOpen, Clock, Settings, Download, Home, Brain } from 'lucide-react';
import { checkApiHealth } from './services/api';
import Dashboard from './components/Dashboard';
import SubjectManagement from './components/SubjectManagement';
import FacultyManagement from './components/FacultyManagement';
import TimetableGeneration from './components/TimetableGeneration';
import TimetableView from './components/TimetableView';
import InfrastructureManagement from './components/InfrastructureManagement';
import AIDemo from './components/AIDemo';

type TabType = 'dashboard' | 'subjects' | 'faculty' | 'infrastructure' | 'generate' | 'view' | 'ai-demo';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Check API health on app startup
  useEffect(() => {
    const checkApi = async () => {
      try {
        const isHealthy = await checkApiHealth();
        setApiStatus(isHealthy ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Failed to check API health:', error);
        setApiStatus('disconnected');
      }
    };

    checkApi();
    // Check every 30 seconds
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'ai-demo', label: 'AI Features', icon: Brain },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'infrastructure', label: 'Infrastructure', icon: Settings },
    { id: 'generate', label: 'Generate Timetable', icon: Calendar },
    { id: 'view', label: 'View Timetables', icon: Clock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'ai-demo':
        return <AIDemo />;
      case 'subjects':
        return <SubjectManagement />;
      case 'faculty':
        return <FacultyManagement />;
      case 'infrastructure':
        return <InfrastructureManagement />;
      case 'generate':
        return <TimetableGeneration />;
      case 'view':
        return <TimetableView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Department Timetable Manager
                </h1>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    apiStatus === 'connected' ? 'bg-green-100 text-green-800' :
                    apiStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {apiStatus === 'connected' ? '✅ MongoDB Connected' :
                     apiStatus === 'disconnected' ? '❌ API Disconnected' :
                     '🔄 Checking Connection'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {apiStatus === 'connected' ? 'Backend server running on port 3001' :
                     apiStatus === 'disconnected' ? 'Start the backend server' :
                     'Verifying backend status'}
                  </span>
                </div>
              </div>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <div className="p-4">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id as TabType)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === item.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;