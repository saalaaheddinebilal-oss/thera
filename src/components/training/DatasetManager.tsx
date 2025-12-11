import { useState, useEffect } from 'react';
import { Upload, Eye, Trash2, FileText } from 'lucide-react';

interface DatasetManagerProps {
  onSelectDataset: (datasetId: string) => void;
}

interface Dataset {
  id: string;
  name: string;
  file_path: string;
  row_count?: number;
  column_count?: number;
  created_at: string;
}

export function DatasetManager({ onSelectDataset }: DatasetManagerProps) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  async function loadDatasets() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_datasets`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDatasets(data || []);
      }
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function viewPreview(dataset: Dataset) {
    setSelectedDataset(dataset);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL?.replace('3000', '8000') || 'http://localhost:8000'}/api/training/dataset-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ file_path: dataset.file_path }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    }
  }

  async function deleteDataset(datasetId: string) {
    if (confirm('Are you sure you want to delete this dataset?')) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_datasets?id=eq.${datasetId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
          }
        );

        if (response.ok) {
          setDatasets(datasets.filter(d => d.id !== datasetId));
        }
      } catch (error) {
        console.error('Error deleting dataset:', error);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Available Datasets</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Upload className="w-4 h-4" />
            Upload Dataset
          </button>
        </div>

        {datasets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No datasets available</p>
            <p className="text-sm text-gray-500">Upload a CSV file to get started with model training</p>
          </div>
        ) : (
          <div className="space-y-3">
            {datasets.map((dataset) => (
              <div key={dataset.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                  <p className="text-sm text-gray-600">
                    {dataset.row_count} rows × {dataset.column_count} columns
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(dataset.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewPreview(dataset)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDataset(dataset);
                      onSelectDataset(dataset.id);
                    }}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Select
                  </button>
                  <button
                    onClick={() => deleteDataset(dataset.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Dataset Preview: {selectedDataset?.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {previewData.columns && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Columns ({previewData.columns.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewData.columns.map((col: string) => (
                      <span key={col} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {previewData.data && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">First 5 Rows</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          {previewData.columns?.map((col: string) => (
                            <th key={col} className="px-4 py-2 text-left text-gray-700 font-medium border border-gray-200">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.data.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {previewData.columns?.map((col: string) => (
                              <td key={`${idx}-${col}`} className="px-4 py-2 text-gray-700 border border-gray-200">
                                {String(row[col] || '—').substring(0, 50)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
