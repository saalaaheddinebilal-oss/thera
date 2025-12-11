import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Brain, AlertTriangle } from 'lucide-react';
import { DatasetManager } from '../components/training/DatasetManager';
import { TrainingConfiguration } from '../components/training/TrainingConfiguration';
import { TrainingProgressMonitor } from '../components/training/TrainingProgressMonitor';
import { ModelEvaluation } from '../components/training/ModelEvaluation';

type TabType = 'datasets' | 'configure' | 'training' | 'evaluation';

export function AIModelTrainingPage() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('datasets');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [trainingActive, setTrainingActive] = useState(false);

  if (profile?.role !== 'system_admin') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-bold text-red-900 mb-1">Access Denied</h3>
            <p className="text-red-700">This feature is only available to system administrators.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Model Training</h1>
        </div>
        <p className="text-gray-600">Manage datasets, configure training, and evaluate model performance</p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('datasets')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'datasets'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Datasets
          </button>
          <button
            onClick={() => setActiveTab('configure')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'configure'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'training'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Training
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'evaluation'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Evaluation
          </button>
        </div>
      </div>

      <div className="content-area">
        {activeTab === 'datasets' && (
          <DatasetManager onSelectDataset={setSelectedDataset} />
        )}
        {activeTab === 'configure' && (
          <TrainingConfiguration selectedDataset={selectedDataset} />
        )}
        {activeTab === 'training' && (
          <TrainingProgressMonitor onTrainingStateChange={setTrainingActive} />
        )}
        {activeTab === 'evaluation' && (
          <ModelEvaluation />
        )}
      </div>
    </div>
  );
}
