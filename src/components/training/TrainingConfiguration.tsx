import { useState, useEffect } from 'react';
import { Settings, Play } from 'lucide-react';

interface TrainingConfigurationProps {
  selectedDataset: string;
}

interface Dataset {
  id: string;
  name: string;
  row_count: number;
  column_count: number;
}

export function TrainingConfiguration({ selectedDataset }: TrainingConfigurationProps) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [configName, setConfigName] = useState('');
  const [modelType, setModelType] = useState('random_forest');
  const [targetColumn, setTargetColumn] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [trainTestSplit, setTrainTestSplit] = useState(0.8);
  const [hyperparameters, setHyperparameters] = useState<any>({
    n_estimators: 100,
    max_depth: 10,
    learning_rate: 0.1,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDataset) {
      loadDatasetInfo();
    }
  }, [selectedDataset]);

  async function loadDatasetInfo() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_datasets?id=eq.${selectedDataset}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setDataset(data[0]);
          // Fetch columns
          const previewResponse = await fetch(
            `${import.meta.env.VITE_API_URL?.replace('3000', '8000') || 'http://localhost:8000'}/api/training/dataset-preview`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ file_path: data[0].file_path }),
            }
          );

          if (previewResponse.ok) {
            const previewData = await previewResponse.json();
            setColumns(previewData.columns || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading dataset info:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleFeature(column: string) {
    setSelectedFeatures(prev =>
      prev.includes(column)
        ? prev.filter(f => f !== column)
        : [...prev, column]
    );
  }

  function updateHyperparameter(key: string, value: any) {
    setHyperparameters(prev => ({
      ...prev,
      [key]: value,
    }));
  }

  async function startTraining() {
    if (!dataset || !targetColumn || selectedFeatures.length === 0) {
      alert('Please select target column and at least one feature');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_configurations`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: configName || `Training_${new Date().getTime()}`,
            dataset_id: dataset.id,
            model_type: modelType,
            target_column: targetColumn,
            feature_columns: selectedFeatures,
            train_test_split: trainTestSplit,
            hyperparameters: hyperparameters,
            preprocessing_options: {},
            created_by: JSON.parse(localStorage.getItem('user_id') || '""'),
          }),
        }
      );

      if (response.ok) {
        const config = await response.json();

        // Initiate training
        const trainingResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_jobs`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              configuration_id: config[0].id,
              status: 'pending',
              created_by: JSON.parse(localStorage.getItem('user_id') || '""'),
            }),
          }
        );

        if (trainingResponse.ok) {
          alert('Training job created successfully!');
          // Reset form
          setConfigName('');
          setTargetColumn('');
          setSelectedFeatures([]);
        }
      }
    } catch (error) {
      console.error('Error starting training:', error);
      alert('Failed to start training');
    }
  }

  if (!dataset) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Settings className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Select a dataset from the Datasets tab to configure training</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Training Configuration</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Selected Dataset:</strong> {dataset.name} ({dataset.row_count} rows, {dataset.column_count} columns)
        </p>
      </div>

      <div className="space-y-6">
        {/* Configuration Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Configuration Name (Optional)
          </label>
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="e.g., Autism Screening Model v2"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Model Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model Type
          </label>
          <select
            value={modelType}
            onChange={(e) => setModelType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="random_forest">Random Forest</option>
            <option value="gradient_boosting">Gradient Boosting</option>
            <option value="neural_network">Neural Network</option>
            <option value="svm">Support Vector Machine</option>
            <option value="xgboost">XGBoost</option>
          </select>
        </div>

        {/* Target Column Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Column (for classification/regression)
          </label>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select target column...</option>
            {columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </div>

        {/* Feature Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Features ({selectedFeatures.length}/{columns.length - 1} selected)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
            {columns.map((col) => (
              col !== targetColumn && (
                <label key={col} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(col)}
                    onChange={() => toggleFeature(col)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{col}</span>
                </label>
              )
            ))}
          </div>
        </div>

        {/* Train/Test Split */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Train/Test Split Ratio: {Math.round(trainTestSplit * 100)}% / {Math.round((1 - trainTestSplit) * 100)}%
          </label>
          <input
            type="range"
            min="0.5"
            max="0.95"
            step="0.05"
            value={trainTestSplit}
            onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Hyperparameters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Hyperparameters
          </label>
          <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
            {Object.entries(hyperparameters).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 w-32">
                  {key.replace(/_/g, ' ')}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => updateHyperparameter(key, parseFloat(e.target.value))}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Start Training Button */}
        <button
          onClick={startTraining}
          disabled={!targetColumn || selectedFeatures.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Play className="w-5 h-5" />
          Start Training
        </button>
      </div>
    </div>
  );
}
