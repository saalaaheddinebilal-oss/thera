import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { X, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';

interface RiskDetectionModalProps {
    studentId: string;
    studentName: string;
    onClose: () => void;
}

export function RiskDetectionModal({ studentId, studentName, onClose }: RiskDetectionModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<any>(null);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        setLoadingData(false);
    }, []);

    async function handleAnalyze() {
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('3000', '8000') || 'http://localhost:8000'}/api/analysis/risk/detect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentId,
                    behavioral_data: [],
                    progress_data: [],
                }),
            });

            if (!response.ok) {
                throw new Error('Analysis failed');
            }

            const data = await response.json();
            setResults(data);
        } catch (err: any) {
            setError(err.message || 'Failed to detect risks');
        } finally {
            setLoading(false);
        }
    }

    const getRiskColor = (level: string) => {
        const colors: any = {
            high: 'bg-red-100 text-red-800',
            moderate: 'bg-orange-100 text-orange-800',
            low: 'bg-green-100 text-green-800',
        };
        return colors[level] || 'bg-gray-100 text-gray-800';
    };

    const getSeverityColor = (severity: string) => {
        const colors: any = {
            high: 'text-red-600',
            moderate: 'text-orange-600',
            low: 'text-green-600',
        };
        return colors[severity] || 'text-gray-600';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t('ai.riskDetection')}</h2>
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

                            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                <p className="text-sm text-gray-700">
                                    AI will analyze behavioral patterns and progress data to identify potential risks
                                    and areas requiring intervention.
                                </p>
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={loading || loadingData}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                <AlertTriangle className="w-5 h-5" />
                                {loading ? t('ai.analyzing') : loadingData ? t('common.loading') : 'Detect Risks'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">{t('ai.analysisComplete')}</span>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <p className="text-sm text-gray-600 mb-2">Overall Risk Level</p>
                                <div className={`inline-block px-6 py-3 rounded-full text-2xl font-bold ${getRiskColor(results.risk_level)}`}>
                                    {results.risk_level.toUpperCase()}
                                </div>
                            </div>

                            {results.risk_summary && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Intervention Priority</p>
                                        <div className="text-xl font-bold text-gray-900 capitalize">
                                            {results.risk_summary.priority}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Confidence</p>
                                        <div className="text-xl font-bold text-gray-900">
                                            {Math.round(results.confidence * 100)}%
                                        </div>
                                    </div>
                                </div>
                            )}

                            {results.identified_risks && results.identified_risks.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Identified Risks</h3>
                                    <div className="space-y-3">
                                        {results.identified_risks.map((risk: any, idx: number) => (
                                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h4 className="font-medium text-gray-900">{risk.risk_type.replace(/_/g, ' ')}</h4>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(risk.severity)}`}>
                                                        {risk.severity}
                                                    </span>
                                                </div>
                                                {risk.indicators && risk.indicators.length > 0 && (
                                                    <ul className="space-y-1 mt-2">
                                                        {risk.indicators.map((indicator: string, i: number) => (
                                                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                                <span className="text-red-500 mt-1">•</span>
                                                                <span>{indicator}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.early_warnings && results.early_warnings.length > 0 && (
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                        Early Warnings
                                    </h3>
                                    <ul className="space-y-2">
                                        {results.early_warnings.map((warning: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-yellow-600 mt-1">•</span>
                                                <span className="text-gray-700">{warning}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {results.recommended_actions && results.recommended_actions.length > 0 && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Recommended Actions</h3>
                                    <ul className="space-y-2">
                                        {results.recommended_actions.map((action: string, idx: number) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-blue-600 mt-1">•</span>
                                                <span className="text-gray-700">{action}</span>
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
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
