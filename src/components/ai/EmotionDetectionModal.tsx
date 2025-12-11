import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, AlertCircle, Camera, CheckCircle } from 'lucide-react';

interface EmotionDetectionModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
}

export function EmotionDetectionModal({ studentId, studentName, onClose }: EmotionDetectionModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<any>(null);
    const [context, setContext] = useState('');

    async function handleAnalyze() {
        if (!context.trim()) {
            setError('Please provide emotional context or observations');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('3000', '8000') || 'http://localhost:8000'}/api/analysis/emotion/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    context: context,
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Failed to detect emotions');
        } finally {
            setLoading(false);
        }
    }

    const getEmotionColor = (emotion: string) => {
        const colors: any = {
            happy: 'bg-green-100 text-green-800',
            sad: 'bg-blue-100 text-blue-800',
            anxious: 'bg-orange-100 text-orange-800',
            frustrated: 'bg-red-100 text-red-800',
            engaged: 'bg-purple-100 text-purple-800',
            neutral: 'bg-gray-100 text-gray-800',
        };
        return colors[emotion] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Camera className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t('ai.emotionDetection')}</h2>
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
                                    Emotional Context / Observations
                                </label>
                                <textarea
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    placeholder="Describe the emotional state, facial expressions, body language..."
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                            >
                                <Camera className="w-5 h-5" />
                                {loading ? t('ai.analyzing') : 'Detect Emotions'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">{t('ai.analysisComplete')}</span>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-6 text-center">
                                <p className="text-sm text-gray-600 mb-2">Primary Emotion</p>
                                <div className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${getEmotionColor(results.primary_emotion)}`}>
                                    {results.primary_emotion}
                                </div>
                            </div>

                            {results.emotional_state && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Stress Level</p>
                                        <div className="text-xl font-bold text-gray-900">
                                            {results.emotional_state.stress_level}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Engagement</p>
                                        <div className="text-xl font-bold text-gray-900">
                                            {results.emotional_state.engagement_level}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {results.emotion_scores && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Emotion Distribution</h3>
                                    <div className="space-y-2">
                                        {Object.entries(results.emotion_scores).map(([emotion, score]: any) => (
                                            <div key={emotion} className="flex items-center gap-3">
                                                <span className="text-sm text-gray-700 capitalize w-24">{emotion}</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-purple-600 h-3 rounded-full"
                                                        style={{ width: `${score * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 w-12">
                                                    {Math.round(score * 100)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.support_recommendations && results.support_recommendations.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Support Recommendations</h3>
                                    <ul className="space-y-2">
                                        {results.support_recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-purple-600 mt-1">•</span>
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
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
