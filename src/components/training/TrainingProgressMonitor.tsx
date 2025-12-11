import { useState, useEffect } from 'react';
import { Play, Square, TrendingUp, BarChart3 } from 'lucide-react';

interface TrainingProgressMonitorProps {
  onTrainingStateChange: (isActive: boolean) => void;
}

interface TrainingMetric {
  epoch: number;
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  f1_score: number;
  validation_accuracy: number;
  validation_loss: number;
}

export function TrainingProgressMonitor({ onTrainingStateChange }: TrainingProgressMonitorProps) {
  const [trainingJobs, setTrainingJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [metrics, setMetrics] = useState<TrainingMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    loadTrainingJobs();
    setupWebSocket();
  }, []);

  function setupWebSocket() {
    try {
      const protocol = import.meta.env.VITE_API_URL?.includes('https') ? 'wss' : 'ws';
      const host = import.meta.env.VITE_API_URL?.replace('http://', '').replace('https://', '').split(':')[0] || 'localhost';
      const ws = new WebSocket(`${protocol}://${host}:8000/ws/training`);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'metric') {
          setMetrics(prev => [...prev, data.metric]);
        } else if (data.type === 'status') {
          if (selectedJob?.id === data.job_id) {
            setSelectedJob(prev => ({
              ...prev,
              current_epoch: data.current_epoch,
              status: data.status,
            }));
          }
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      return () => ws.close();
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  }

  async function loadTrainingJobs() {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_jobs?order=created_at.desc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrainingJobs(data || []);
        if (data.length > 0) {
          selectJob(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading training jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function selectJob(job: any) {
    setSelectedJob(job);
    onTrainingStateChange(job.status === 'running');

    // Load metrics for this job
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_metrics?training_job_id=eq.${job.id}&order=epoch.asc`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMetrics(data || []);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }

  async function cancelTraining(jobId: string) {
    if (confirm('Cancel this training job?')) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/training_jobs?id=eq.${jobId}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'cancelled' }),
          }
        );

        if (response.ok) {
          loadTrainingJobs();
        }
      } catch (error) {
        console.error('Error cancelling job:', error);
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const progressPercent = selectedJob
    ? (selectedJob.current_epoch / selectedJob.total_epochs) * 100
    : 0;

  const latestMetric = metrics[metrics.length - 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Training Jobs List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Training Jobs</h2>

        {trainingJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No training jobs yet. Create a configuration to start training.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainingJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => selectJob(job)}
                className={`w-full p-4 border-2 rounded-lg text-left transition ${
                  selectedJob?.id === job.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Job {job.id.slice(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Epoch {job.current_epoch}/{job.total_epochs}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Progress Monitor */}
      {selectedJob && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Training Progress</h2>
            <div className="text-sm text-gray-600">
              {wsConnected && <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-2"></span>}
              {wsConnected ? 'Live' : 'Offline'}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-900">{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Metrics Grid */}
          {latestMetric && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Accuracy</p>
                <p className="text-2xl font-bold text-gray-900">{(latestMetric.accuracy * 100).toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Loss</p>
                <p className="text-2xl font-bold text-gray-900">{latestMetric.loss.toFixed(4)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">F1-Score</p>
                <p className="text-2xl font-bold text-gray-900">{(latestMetric.f1_score * 100).toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Validation Acc</p>
                <p className="text-2xl font-bold text-gray-900">{(latestMetric.validation_accuracy * 100).toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Training Log */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Training Metrics
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {metrics.length === 0 ? (
                <p className="text-sm text-gray-600">No metrics recorded yet</p>
              ) : (
                <div className="space-y-2 text-sm font-mono">
                  {metrics.map((metric, idx) => (
                    <div key={idx} className="text-gray-700 border-b border-gray-200 pb-2">
                      <strong>Epoch {metric.epoch}</strong> | Acc: {(metric.accuracy * 100).toFixed(1)}% | Loss: {metric.loss.toFixed(4)} | Val Acc: {(metric.validation_accuracy * 100).toFixed(1)}%
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {selectedJob?.status === 'running' && (
            <button
              onClick={() => cancelTraining(selectedJob.id)}
              className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              <Square className="w-5 h-5" />
              Cancel Training
            </button>
          )}
        </div>
      )}
    </div>
  );
}
