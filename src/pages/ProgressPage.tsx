import React from 'react';
import { useProgress } from '../context/ProgressContext';
import { Download } from 'lucide-react';

const ProgressPage: React.FC = () => {
  const { progress, exportProgress, resetProgress } = useProgress();

  if (!progress) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Your Progress</h1>
        <p className="text-gray-600 dark:text-gray-300">No progress data available.</p>
      </div>
    );
  }

  const handleExport = () => {
    const csv = exportProgress();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `math_progress_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress data? This cannot be undone.')) {
      resetProgress();
    }
  };

  // Get operations that have been practiced
  const practicedOperations = Object.values(progress.operations);
  const totalExercisesCompleted = practicedOperations.reduce((sum, op) => sum + op.totalCompleted, 0);
  const totalCorrectAnswers = practicedOperations.reduce((sum, op) => sum + op.correctAnswers, 0);
  const overallAccuracy = totalExercisesCompleted > 0 
    ? (totalCorrectAnswers / totalExercisesCompleted * 100).toFixed(1) 
    : '0';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">Your Progress</h1>
        <div className="flex space-x-4">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-5 w-5 mr-2" />
            Export Data
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Reset Progress
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md">
            <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{progress.streakDays} days</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md">
            <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1">Exercises Completed</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{totalExercisesCompleted}</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-md">
            <p className="text-sm text-indigo-600 dark:text-indigo-300 mb-1">Overall Accuracy</p>
            <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">{overallAccuracy}%</p>
          </div>
        </div>
      </div>

      {practicedOperations.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Operation Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Operation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Completed
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Avg. Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Practice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Object.entries(progress.operations).map(([opId, opData]) => {
                  const accuracy = (opData.correctAnswers / opData.totalCompleted * 100).toFixed(1);
                  const lastPracticed = new Date(opData.lastPracticed).toLocaleDateString();
                  
                  let opName = opId.charAt(0).toUpperCase() + opId.slice(1);
                  
                  return (
                    <tr key={opId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {opName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {opData.totalCompleted}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {accuracy}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {opData.averageTime.toFixed(1)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {lastPracticed}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300">You haven't practiced any operations yet. 
          Start practicing to see your detailed progress!</p>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;