import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { User, Mail, Camera } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const { progress } = useProgress();
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  
  if (!user) {
    return (
      <div className="text-center py-12">
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  const handleSaveProfile = () => {
    // In a real app, this would make an API call to update the user profile
    setIsEditing(false);
    // For now we'll just show that it's saved, but the changes won't persist
    // since we're using local storage for this demo
  };
  
  // Calculate stats
  const operationsCount = progress ? Object.keys(progress.operations).length : 0;
  const totalExercises = progress 
    ? Object.values(progress.operations).reduce((sum, op) => sum + op.totalCompleted, 0) 
    : 0;
  const correctAnswers = progress 
    ? Object.values(progress.operations).reduce((sum, op) => sum + op.correctAnswers, 0) 
    : 0;
  const averageAccuracy = totalExercises > 0 
    ? (correctAnswers / totalExercises * 100).toFixed(1) 
    : '0';
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 h-32 flex items-center justify-center">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
        </div>
        
        <div className="p-8 relative">
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
            <div className="bg-white dark:bg-gray-700 rounded-full p-2 shadow-lg">
              <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                <User className="w-12 h-12" />
              </div>
              <button className="absolute bottom-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-16">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                  <div className="flex items-center justify-center mt-1 text-gray-500 dark:text-gray-400">
                    <Mail className="w-4 h-4 mr-1" />
                    <span>{user.email}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md text-center">
                    <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1">Operations Practiced</p>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{operationsCount}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md text-center">
                    <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1">Exercises Completed</p>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{totalExercises}</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md text-center">
                    <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1">Average Accuracy</p>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{averageAccuracy}%</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={logout}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;