import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, AlertCircle, Activity, CheckCircle } from 'lucide-react';

interface BehaviorAnalysisModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
}

export function BehaviorAnalysisModal({ studentId, studentName, onClose }: BehaviorAnalysisModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<any>(null);
    const [observations, setObservations] = useState('');

    async function handleAnalyze() {
        if (!observations.trim()) {
            setError('Please provide behavioral observations');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('3000', '8000') || 'http://localhost:8000'}/api/analysis/behavior/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    observation_notes: observations,
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze behavior');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Activity className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t('ai.behaviorAnalysis')}</h2>
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Behavioral Observations
                                </label>
                                <textarea
                                    value={observations}
                                    onChange={(e) => setObservations(e.target.value)}
                                    placeholder="Describe observed behaviors, attention patterns, social interactions..."
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                <Activity className="w-5 h-5" />
                                {loading ? t('ai.analyzing') : 'Analyze Behavior'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">{t('ai.analysisComplete')}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Attention Span</p>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {Math.round(results.attention_span_seconds)} sec
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Activity Level</p>
                                    <div className="text-2xl font-bold text-gray-900 capitalize">
                                        {results.activity_level}
                                    </div>
                                </div>
                            </div>

                            {results.behavioral_summary && (
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-3">Behavioral Summary</h3>
                                    <div className="space-y-2">
                                        {Object.entries(results.behavioral_summary).map(([key, value]: any) => (
                                            <div key={key} className="flex justify-between items-center">
                                                <span className="text-gray-700 capitalize">{key.replace(/_/g, ' ')}</span>
                                                <span className="font-medium text-gray-900">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.patterns && results.patterns.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Identified Patterns</h3>
                                    <ul className="space-y-2">
                                        {results.patterns.map((pattern: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-green-600 mt-1">•</span>
                                                <span className="text-gray-700">{pattern}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {results.intervention_recommendations && results.intervention_recommendations.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Intervention Recommendations</h3>
                                    <ul className="space-y-2">
                                        {results.intervention_recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-blue-600 mt-1">•</span>
                                                <span className="text-gray-700">{rec}</span>
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
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
