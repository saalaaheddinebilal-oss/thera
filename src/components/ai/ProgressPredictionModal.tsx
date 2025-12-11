import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

interface ProgressPredictionModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
}

export function ProgressPredictionModal({ studentId, studentName, onClose }: ProgressPredictionModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [progressData, setProgressData] = useState<any[]>([]);

    useEffect(() => {
        loadProgressData();
    }, [studentId]);

    async function loadProgressData() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/students/${studentId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setProgressData([data]);
            }
        } catch (error) {
            console.error('Error loading progress data:', error);
        } finally {
            setLoadingData(false);
        }
    }

    async function handleAnalyze() {
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('3000', '8000') || 'http://localhost:8000'}/api/analysis/progress/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    progress_data: progressData,
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Failed to predict progress');
        } finally {
            setLoading(false);
        }
    }

    const getTrajectoryColor = (trajectory: string) => {
        const colors: any = {
            improving: 'bg-green-100 text-green-800',
            stable: 'bg-blue-100 text-blue-800',
            needs_attention: 'bg-orange-100 text-orange-800',
        };
        return colors[trajectory] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t('ai.progressPrediction')}</h2>
                            <p className="text-sm text-gray-600">{studentName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!results ? (
                        <div className="space-y-6">
                            {error && (
                                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                                    <AlertCircle className="w-5 h-5" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <div className="bg-blue-50 rounded-lg p-4">
                                <p className="text-sm text-gray-700">
                                    AI will analyze historical progress data to predict future development trajectory
                                    and goal achievement probability.
                                </p>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || loadingData}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                            >
                                <TrendingUp className="w-5 h-5" />
                                {loading ? t('ai.analyzing') : loadingData ? t('common.loading') : 'Predict Progress'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">{t('ai.analysisComplete')}</span>
                            </div>

                            <div className="bg-orange-50 rounded-lg p-6">
                                <p className="text-sm text-gray-600 mb-2">Current Trajectory</p>
                                <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${getTrajectoryColor(results.current_trajectory)}`}>
                                    {results.current_trajectory.replace('_', ' ')}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Goal Achievement Probability</p>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {Math.round(results.goal_achievement_probability * 100)}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Confidence</p>
                                    <div className="text-3xl font-bold text-gray-900">
                                        {Math.round(results.confidence * 100)}%
                                    </div>
                                </div>
                            </div>

                            {results.progress_insights && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Progress Insights</h3>
                                    <div className="space-y-2">
                                        {Object.entries(results.progress_insights).map(([key, value]: any) => (
                                            <div key={key} className="flex justify-between items-center">
                                                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="font-medium text-gray-900">
                                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.predicted_progress && results.predicted_progress.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Predicted Progress Timeline</h3>
                                    <div className="space-y-3">
                                        {results.predicted_progress.map((item: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.area}</p>
                                                    <p className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-orange-600">{item.predicted_score}</p>
                                                    <p className="text-xs text-gray-500">Predicted Score</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.intervention_suggestions && results.intervention_suggestions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Intervention Suggestions</h3>
                                    <ul className="space-y-2">
                                        {results.intervention_suggestions.map((suggestion: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-orange-600 mt-1">•</span>
                                                <span className="text-gray-700">{suggestion}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={() => setResults(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    New Analysis
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                >
                                    {t('common.close')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
