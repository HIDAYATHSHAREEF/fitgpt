import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChevronRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const steps = [
  { id: 'basics', title: 'The Basics' },
  { id: 'goal', title: 'Your Goal' },
  { id: 'details', title: 'Experience & Gear' },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    age: 25,
    weight: 70,
    height: 170,
    goal: 'weight_loss',
    experience: 'beginner',
    equipment: 'bodyweight'
  });

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(formData as UserProfile);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-fitness-muted mb-1">Name</label>
              <input
                type="text"
                className="w-full bg-fitness-card border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-fitness-primary outline-none"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="What should we call you?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-fitness-muted mb-1">Age</label>
                <input
                  type="number"
                  className="w-full bg-fitness-card border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-fitness-primary outline-none"
                  value={formData.age}
                  onChange={(e) => handleChange('age', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fitness-muted mb-1">Height (cm)</label>
                <input
                  type="number"
                  className="w-full bg-fitness-card border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-fitness-primary outline-none"
                  value={formData.height}
                  onChange={(e) => handleChange('height', parseInt(e.target.value))}
                />
              </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-fitness-muted mb-1">Weight (kg)</label>
                <input
                  type="number"
                  className="w-full bg-fitness-card border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-fitness-primary outline-none"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', parseInt(e.target.value))}
                />
              </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-3">
             <label className="block text-sm font-medium text-fitness-muted mb-1">Select your primary goal</label>
            {['weight_loss', 'muscle_gain', 'endurance', 'general_fitness'].map((g) => (
              <button
                key={g}
                onClick={() => handleChange('goal', g)}
                className={`w-full p-4 rounded-lg border text-left flex justify-between items-center transition-all ${
                  formData.goal === g 
                  ? 'bg-fitness-primary/20 border-fitness-primary text-fitness-primary' 
                  : 'bg-fitness-card border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                <span className="capitalize">{g.replace('_', ' ')}</span>
                {formData.goal === g && <Check size={20} />}
              </button>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-fitness-muted mb-2">Experience Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['beginner', 'intermediate', 'advanced'].map((l) => (
                   <button
                   key={l}
                   onClick={() => handleChange('experience', l)}
                   className={`p-2 rounded-lg border text-center text-sm transition-all ${
                     formData.experience === l
                     ? 'bg-fitness-secondary/20 border-fitness-secondary text-fitness-secondary' 
                     : 'bg-fitness-card border-gray-700 text-gray-300 hover:border-gray-500'
                   }`}
                 >
                   <span className="capitalize">{l}</span>
                 </button>
                ))}
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-fitness-muted mb-2">Available Equipment</label>
              <div className="grid grid-cols-1 gap-2">
                {['bodyweight', 'home_dumbbells', 'gym', 'resistance_bands'].map((e) => (
                   <button
                   key={e}
                   onClick={() => handleChange('equipment', e)}
                   className={`p-3 rounded-lg border text-left text-sm transition-all ${
                     formData.equipment === e
                     ? 'bg-fitness-accent/20 border-fitness-accent text-fitness-accent' 
                     : 'bg-fitness-card border-gray-700 text-gray-300 hover:border-gray-500'
                   }`}
                 >
                   <span className="capitalize">{e.replace('_', ' ')}</span>
                 </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-fitness-dark p-4">
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-white">Setup Profile</h1>
            <span className="text-fitness-primary font-mono text-sm">
              Step {step + 1}/{steps.length}
            </span>
          </div>
          <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-fitness-primary to-fitness-secondary transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        <button
          onClick={handleNext}
          disabled={!formData.name && step === 0}
          className={`w-full mt-6 py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
             !formData.name && step === 0 
             ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
             : 'bg-gradient-to-r from-fitness-primary to-fitness-secondary text-white hover:opacity-90 shadow-lg shadow-fitness-primary/20'
          }`}
        >
          {step === steps.length - 1 ? 'Start Journey' : 'Next'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
