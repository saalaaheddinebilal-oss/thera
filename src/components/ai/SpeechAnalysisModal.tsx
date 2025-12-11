import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, AlertCircle, Mic, CheckCircle, TrendingUp } from 'lucide-react';

interface SpeechAnalysisModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
}

export function SpeechAnalysisModal({ studentId, studentName, onClose }: SpeechAnalysisModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<any>(null);
    const [textInput, setTextInput] = useState('');

    async function handleAnalyze() {
        if (!textInput.trim()) {
            setError('Please provide speech sample or text input');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('3000', '8000') || 'http://localhost:8000'}/api/analysis/speech/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    text_input: textInput,
                    audio_data: null,
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze speech');
        } finally {
            setLoading(false);
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600 bg-green-50';
        if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mic className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t('ai.speechAnalysis')}</h2>
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
                                    Speech Sample / Text Input
                                </label>
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    placeholder="Enter text for speech analysis or describe speech patterns..."
                                    rows={6}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Enter text to analyze pronunciation patterns and speech clarity
                                </p>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Mic className="w-5 h-5" />
                                {loading ? t('ai.analyzing') : 'Analyze Speech'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">{t('ai.analysisComplete')}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Pronunciation</p>
                                    <div className={`text-2xl font-bold ${getScoreColor(results.pronunciation_score)}`}>
                                        {Math.round(results.pronunciation_score * 100)}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Clarity</p>
                                    <div className={`text-2xl font-bold ${getScoreColor(results.clarity_score)}`}>
                                        {Math.round(results.clarity_score * 100)}%
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 mb-1">Fluency</p>
                                    <div className={`text-2xl font-bold ${getScoreColor(results.fluency_score)}`}>
                                        {Math.round(results.fluency_score * 100)}%
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    <h3 className="font-semibold text-gray-900">Overall Assessment</h3>
                                </div>
                                <p className="text-gray-700">{results.overall_assessment}</p>
                            </div>

                            {results.problematic_sounds && results.problematic_sounds.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Sounds Requiring Practice</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {results.problematic_sounds.map((sound: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                                            >
                                                {sound}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.recommendations && results.recommendations.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                                    <ul className="space-y-2">
                                        {results.recommendations.map((rec: string, idx: number) => (
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
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
