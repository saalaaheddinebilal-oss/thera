import { useState, useEffect } from 'react';
import { TrendingUp, Download, Trash2, CheckCircle } from 'lucide-react';

interface ModelVersion {
  id: string;
  training_job_id: string;
  model_type: string;
  version_number: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_score: number;
  is_active: boolean;
  created_at: string;
}

export function ModelEvaluation() {
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<ModelVersion | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  async function loadModels() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/model_versions?order=created_at.desc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setModels(data || []);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  }

  async function setAsActive(modelId: string) {
    try {
      // Deactivate all other models
      await Promise.all(
        models
          .filter(m => m.id !== modelId && m.is_active)
          .map(m =>
            fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/model_versions?id=eq.${m.id}`, {
              method: 'PATCH',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ is_active: false }),
            })
          )
      );

      // Activate selected model
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/model_versions?id=eq.${modelId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: true }),
        }
      );

      if (response.ok) {
        loadModels();
      }
    } catch (error) {
      console.error('Error setting active model:', error);
    }
  }

  async function deleteModel(modelId: string) {
    if (confirm('Delete this model version?')) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/model_versions?id=eq.${modelId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );

        if (response.ok) {
          setModels(models.filter(m => m.id !== modelId));
        }
      } catch (error) {
        console.error('Error deleting model:', error);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Model Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Model Versions
        </h2>

        {models.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No trained models yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Version</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Model Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Accuracy</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">F1-Score</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Precision</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Recall</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">AUC</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {models.map((model) => (
                  <tr key={model.id} className={`hover:bg-gray-50 ${model.is_active ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">v{model.version_number}</span>
                        {model.is_active && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{model.model_type}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {(model.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {(model.f1_score * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {(model.precision * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {(model.recall * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {model.auc_score ? (model.auc_score * 100).toFixed(1) + '%' : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedModel(model);
                            setShowDetails(true);
                          }}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Details
                        </button>
                        {!model.is_active && (
                          <button
                            onClick={() => setAsActive(model.id)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Deploy
                          </button>
                        )}
                        <button
                          onClick={() => deleteModel(model.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Details Modal */}
      {showDetails && selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                Model v{selectedModel.version_number} Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Performance Metrics */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                    <p className="text-2xl font-bold text-gray-900">{(selectedModel.accuracy * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">F1-Score</p>
                    <p className="text-2xl font-bold text-gray-900">{(selectedModel.f1_score * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Precision</p>
                    <p className="text-2xl font-bold text-gray-900">{(selectedModel.precision * 100).toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Recall</p>
                    <p className="text-2xl font-bold text-gray-900">{(selectedModel.recall * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* Model Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Model Information</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Type</dt>
                    <dd className="font-medium text-gray-900">{selectedModel.model_type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Status</dt>
                    <dd className="font-medium text-gray-900">
                      {selectedModel.is_active ? 'Active (Production)' : 'Inactive'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Created</dt>
                    <dd className="font-medium text-gray-900">
                      {new Date(selectedModel.created_at).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {!selectedModel.is_active && (
                  <button
                    onClick={() => {
                      setAsActive(selectedModel.id);
                      setShowDetails(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Deploy Model
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
