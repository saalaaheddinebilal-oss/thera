import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { studentsAPI, aiAPI } from '../../lib/api';
import { X, AlertCircle, Brain, Loader } from 'lucide-react';

interface CreateIEPModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateIEPModal({ onClose, onSuccess }: CreateIEPModalProps) {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [generatingWithAI, setGeneratingWithAI] = useState(false);
    const [formData, setFormData] = useState({
        studentId: '',
        startDate: '',
        endDate: '',
        goals: [{ area: '', goal: '', baseline: '', targetDate: '', strategies: '' }],
        accommodations: [''],
    });

    useEffect(() => {
        loadStudents();
        const today = new Date().toISOString().split('T')[0];
        const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setFormData(prev => ({
            ...prev,
            startDate: today,
            endDate: oneYearLater,
        }));
    }, []);

    async function loadStudents() {
        try {
            const data = await studentsAPI.getAll();
            setStudents(data || []);
        } catch (error) {
            console.error('Error loading students:', error);
            setError('Failed to load students list');
        } finally {
            setLoadingStudents(false);
        }
    }

    async function handleGenerateWithAI() {
        if (!formData.studentId) {
            setError('Please select a student first');
            return;
        }

        setGeneratingWithAI(true);
        setError('');

        try {
            const result = await aiAPI.generateIEP(formData.studentId);

            const goals = result.goals.map((g: any) => ({
                area: g.area || '',
                goal: g.goal || '',
                baseline: g.baseline || '',
                targetDate: g.target_date || '',
                strategies: Array.isArray(g.strategies) ? g.strategies.join(', ') : '',
            }));

            setFormData(prev => ({
                ...prev,
                goals: goals.length > 0 ? goals : prev.goals,
                accommodations: result.accommodations || prev.accommodations,
                startDate: result.timeline?.start_date || prev.startDate,
                endDate: result.timeline?.end_date || prev.endDate,
            }));

            alert(t('iep.generateWithAI') + ' - ' + t('ai.analysisComplete'));
        } catch (err: any) {
            console.error('Error generating IEP:', err);
            setError(err.response?.data?.error || 'Failed to generate IEP with AI');
        } finally {
            setGeneratingWithAI(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const goalsData = formData.goals
                .filter(g => g.goal.trim())
                .map(g => ({
                    area: g.area,
                    goal: g.goal,
                    baseline: g.baseline,
                    target_date: g.targetDate,
                    strategies: g.strategies.split(',').map(s => s.trim()).filter(Boolean),
                }));

            const accommodationsData = formData.accommodations
                .filter(a => a.trim())
                .map(a => a.trim());

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/iep/plans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
                body: JSON.stringify({
                    studentId: formData.studentId,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    goals: goalsData,
                    accommodations: accommodationsData,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create IEP');
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create IEP plan');
        } finally {
            setLoading(false);
        }
    }

    function addGoal() {
        setFormData(prev => ({
            ...prev,
            goals: [...prev.goals, { area: '', goal: '', baseline: '', targetDate: '', strategies: '' }],
        }));
    }

    function removeGoal(index: number) {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index),
        }));
    }

    function updateGoal(index: number, field: string, value: string) {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.map((g, i) => i === index ? { ...g, [field]: value } : g),
        }));
    }

    function addAccommodation() {
        setFormData(prev => ({
            ...prev,
            accommodations: [...prev.accommodations, ''],
        }));
    }

    function removeAccommodation(index: number) {
        setFormData(prev => ({
            ...prev,
            accommodations: prev.accommodations.filter((_, i) => i !== index),
        }));
    }

    function updateAccommodation(index: number, value: string) {
        setFormData(prev => ({
            ...prev,
            accommodations: prev.accommodations.map((a, i) => i === index ? value : a),
        }));
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">{t('iep.createIEP')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-6 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('sessions.selectStudent')} *
                                </label>
                                <select
                                    value={formData.studentId}
                                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    required
                                    disabled={loadingStudents}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">{loadingStudents ? t('common.loading') : t('sessions.selectStudent')}</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateWithAI}
                                disabled={!formData.studentId || generatingWithAI}
                                className="mt-7 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {generatingWithAI ? (
                                    <>
                                        <Loader className="w-5 h-5 animate-spin" />
                                        {t('ai.analyzing')}
                                    </>
                                ) : (
                                    <>
                                        <Brain className="w-5 h-5" />
                                        {t('iep.generateWithAI')}
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('iep.startDate')} *
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('iep.endDate')} *
                                </label>
                                <input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('iep.goals')} *
                                </label>
                                <button
                                    type="button"
                                    onClick={addGoal}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    + {t('iep.addGoal')}
                                </button>
                            </div>
                            {formData.goals.map((goal, index) => (
                                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700">{t('iep.goal')} {index + 1}</span>
                                        {formData.goals.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeGoal(index)}
                                                className="text-sm text-red-600 hover:text-red-700"
                                            >
                                                {t('common.delete')}
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                {t('sessions.focusArea')}
                                            </label>
                                            <input
                                                type="text"
                                                value={goal.area}
                                                onChange={(e) => updateGoal(index, 'area', e.target.value)}
                                                placeholder="e.g., speech_language, social_emotional, academic"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                {t('iep.goal')} *
                                            </label>
                                            <textarea
                                                value={goal.goal}
                                                onChange={(e) => updateGoal(index, 'goal', e.target.value)}
                                                required
                                                rows={2}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Baseline</label>
                                                <input
                                                    type="text"
                                                    value={goal.baseline}
                                                    onChange={(e) => updateGoal(index, 'baseline', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    {t('iep.targetDate')}
                                                </label>
                                                <input
                                                    type="date"
                                                    value={goal.targetDate}
                                                    onChange={(e) => updateGoal(index, 'targetDate', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-600 mb-1">
                                                Strategies (comma-separated)
                                            </label>
                                            <textarea
                                                value={goal.strategies}
                                                onChange={(e) => updateGoal(index, 'strategies', e.target.value)}
                                                rows={2}
                                                placeholder="Strategy 1, Strategy 2, Strategy 3"
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('iep.accommodations')}
                                </label>
                                <button
                                    type="button"
                                    onClick={addAccommodation}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    + {t('iep.addAccommodation')}
                                </button>
                            </div>
                            {formData.accommodations.map((accommodation, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={accommodation}
                                        onChange={(e) => updateAccommodation(index, e.target.value)}
                                        placeholder="Enter accommodation"
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {formData.accommodations.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeAccommodation(index)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            {t('common.delete')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? t('common.loading') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
