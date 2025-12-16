import React, { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';
import { ProgressEntry, UserProfile } from '../types';
import { Plus, TrendingDown, TrendingUp, Activity, Flame } from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  progressData: ProgressEntry[];
  onAddEntry: (entry: ProgressEntry) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ profile, progressData, onAddEntry }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWeight, setNewWeight] = useState(profile.weight.toString());
  const [newCalories, setNewCalories] = useState('0');
  const [workoutDone, setWorkoutDone] = useState(false);

  // Calculate stats
  const startWeight = progressData[0]?.weight || profile.weight;
  const currentWeight = progressData[progressData.length - 1]?.weight || profile.weight;
  const weightDiff = currentWeight - startWeight;
  const totalWorkouts = progressData.filter(e => e.workoutCompleted).length;
  
  const handleSave = () => {
    const entry: ProgressEntry = {
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: parseFloat(newWeight) || currentWeight,
      caloriesBurned: parseInt(newCalories) || 0,
      workoutCompleted: workoutDone
    };
    onAddEntry(entry);
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 bg-fitness-dark overflow-y-auto p-4 md:p-6 pb-24">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, {profile.name} 👋</h2>
          <p className="text-fitness-muted text-sm">Here's your fitness journey so far.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-fitness-primary hover:bg-emerald-600 text-white p-3 rounded-full shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-fitness-card border border-gray-700 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-fitness-muted text-xs uppercase font-bold tracking-wider">
            <Activity size={14} /> Current Weight
          </div>
          <div className="text-2xl font-bold text-white">{currentWeight} <span className="text-sm text-gray-400">kg</span></div>
          <div className={`text-xs mt-1 font-medium ${weightDiff <= 0 ? 'text-fitness-accent' : 'text-red-400'}`}>
            {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)} kg since start
          </div>
        </div>
        
        <div className="bg-fitness-card border border-gray-700 p-4 rounded-xl">
           <div className="flex items-center gap-2 mb-2 text-fitness-muted text-xs uppercase font-bold tracking-wider">
            <Flame size={14} /> Total Workouts
          </div>
          <div className="text-2xl font-bold text-white">{totalWorkouts}</div>
          <div className="text-xs mt-1 text-fitness-primary font-medium">Keep pushing!</div>
        </div>

        <div className="bg-fitness-card border border-gray-700 p-4 rounded-xl col-span-2 md:col-span-2">
           <div className="flex items-center gap-2 mb-2 text-fitness-muted text-xs uppercase font-bold tracking-wider">
            Goal
          </div>
          <div className="text-lg font-bold text-white capitalize">{profile.goal.replace('_', ' ')}</div>
          <div className="w-full bg-gray-800 h-2 rounded-full mt-2 overflow-hidden">
            <div className="bg-fitness-secondary h-full w-1/3 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weight Trend */}
        <div className="bg-fitness-card border border-gray-700 p-4 rounded-xl">
          <h3 className="text-white font-semibold mb-4 text-sm">Weight History</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981' }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calories Burned */}
        <div className="bg-fitness-card border border-gray-700 p-4 rounded-xl">
          <h3 className="text-white font-semibold mb-4 text-sm">Calories Estimate</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  cursor={{fill: '#334155', opacity: 0.2}} 
                />
                <Bar dataKey="caloriesBurned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-fitness-card border border-gray-700 w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Log Progress</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current Weight (kg)</label>
                <input 
                  type="number" 
                  value={newWeight} 
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-fitness-primary outline-none" 
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Est. Calories Burned Today</label>
                <input 
                  type="number" 
                  value={newCalories} 
                  onChange={(e) => setNewCalories(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-fitness-primary outline-none" 
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox" 
                  id="workoutCheck" 
                  checked={workoutDone}
                  onChange={(e) => setWorkoutDone(e.target.checked)}
                  className="w-5 h-5 accent-fitness-primary rounded cursor-pointer" 
                />
                <label htmlFor="workoutCheck" className="text-white cursor-pointer select-none">I worked out today!</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-lg text-gray-400 hover:text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 bg-fitness-primary text-white font-bold py-3 rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
