import React from 'react';
import { Calendar, Users, BookOpen, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Subjects',
      value: '18',
      change: '+2 this semester',
      icon: BookOpen,
      color: 'bg-blue-500',
    },
    {
      title: 'Faculty Members',
      value: '12',
      change: '3 departments',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Lab Sessions/Week',
      value: '36',
      change: '12 per year',
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      title: 'Classroom Utilization',
      value: '87%',
      change: 'Optimal range',
      icon: CheckCircle,
      color: 'bg-orange-500',
    },
  ];

  const recentActivity = [
    {
      type: 'success',
      message: 'Timetable generated successfully for SE-A',
      time: '2 hours ago',
    },
    {
      type: 'warning',
      message: 'Faculty conflict detected for Dr. Sharma on Monday 2PM',
      time: '4 hours ago',
    },
    {
      type: 'info',
      message: 'New subject "Machine Learning" added to BE curriculum',
      time: '1 day ago',
    },
    {
      type: 'success',
      message: 'Lab schedules optimized, 12% efficiency improvement',
      time: '2 days ago',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Overview of your department timetable management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-blue-900">Generate New Timetable</p>
              <p className="text-sm text-blue-700">Create optimized schedules</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <BookOpen className="h-6 w-6 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-green-900">Add New Subject</p>
              <p className="text-sm text-green-700">Configure course details</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <Users className="h-6 w-6 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-purple-900">Manage Faculty</p>
              <p className="text-sm text-purple-700">Update assignments</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Semester Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Semester</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Academic Year:</span>
              <span className="font-medium">2024-25</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Semester:</span>
              <span className="font-medium">Odd Semester</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Students:</span>
              <span className="font-medium">270 (90 per year)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Working Days:</span>
              <span className="font-medium">Monday - Friday</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Lab Utilization:</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-20"></div>
                </div>
                <span className="text-sm font-medium">83%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Faculty Workload:</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full w-16"></div>
                </div>
                <span className="text-sm font-medium">67%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Conflicts:</span>
              <span className="text-sm font-medium text-green-600">0 Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;