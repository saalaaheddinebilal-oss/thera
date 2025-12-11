import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { studentsAPI } from '../lib/api';
import { Brain, Mic, Video, Camera, TrendingUp, AlertTriangle, Activity, Plus } from 'lucide-react';
import { SpeechAnalysisModal } from '../components/ai/SpeechAnalysisModal';
import { BehaviorAnalysisModal } from '../components/ai/BehaviorAnalysisModal';
import { EmotionDetectionModal } from '../components/ai/EmotionDetectionModal';
import { ProgressPredictionModal } from '../components/ai/ProgressPredictionModal';
import { RiskDetectionModal } from '../components/ai/RiskDetectionModal';

interface Student {
    id: string;
    full_name: string;
}

type ModalType = 'speech' | 'behavior' | 'emotion' | 'progress' | 'risk' | null;

export function AIAnalysisPage() {
    const { t } = useLanguage();
    const { profile } = useAuth();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [analyses, setAnalyses] = useState<any[]>([]);
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    useEffect(() => {
        loadStudents();
    }, []);

    async function loadStudents() {
        try {
            const data = await studentsAPI.getAll();
            setStudents(data || []);
            if (data && data.length > 0) {
                setSelectedStudent(data[0].id);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        } finally {
            setLoading(false);
        }
    }

    function openModal(type: ModalType) {
        if (!selectedStudent) return;
        setActiveModal(type);
    }

    function closeModal() {
        setActiveModal(null);
    }

    function getSelectedStudentName(): string {
        const student = students.find(s => s.id === selectedStudent);
        return student?.full_name || 'Student';
    }

    const analysisTypes = [
        {
            type: 'speech',
            icon: Mic,
            title: t('ai.speechAnalysis'),
            color: 'blue',
            description: 'Analyze pronunciation, clarity, and fluency'
        },
        {
            type: 'behavior',
            icon: Activity,
            title: t('ai.behaviorAnalysis'),
            color: 'green',
            description: 'Track behavioral patterns and attention span'
        },
        {
            type: 'emotion',
            icon: Camera,
            title: t('ai.emotionDetection'),
            color: 'purple',
            description: 'Detect emotions and engagement levels'
        },
        {
            type: 'progress',
            icon: TrendingUp,
            title: t('ai.progressPrediction'),
            color: 'orange',
            description: 'Predict development trajectory and goals'
        },
        {
            type: 'risk',
            icon: AlertTriangle,
            title: t('ai.riskDetection'),
            color: 'red',
            description: 'Identify areas requiring intervention'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: any = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100',
            green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100',
            orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100',
            red: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
        };
        return colors[color] || colors.blue;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">{t('ai.title')}</h1>
                </div>
                <p className="text-gray-600">Analyze student performance using AI-powered tools</p>
            </div>

            {students.length > 0 && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('sessions.selectStudent')}
                    </label>
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {students.map((student) => (
                            <option key={student.id} value={student.id}>
                                {student.full_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {analysisTypes.map((analysis) => {
                    const Icon = analysis.icon;
                    return (
                        <button
                            key={analysis.type}
                            onClick={() => openModal(analysis.type as ModalType)}
                            className={`${getColorClasses(analysis.color)} border-2 rounded-xl p-6 text-left transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                            disabled={!selectedStudent}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white rounded-lg shadow-sm">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <Plus className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{analysis.title}</h3>
                            <p className="text-sm text-gray-600">{analysis.description}</p>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('ai.results')}</h3>
                {analyses.length === 0 ? (
                    <div className="text-center py-12">
                        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">{t('ai.noAnalysis')}</p>
                        <p className="text-sm text-gray-500">Select a student and run an analysis to get started</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {analyses.map((analysis) => (
                            <div
                                key={analysis.id}
                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{analysis.type}</h4>
                                        <p className="text-sm text-gray-600">
                                            {new Date(analysis.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        {t('ai.viewResults')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {activeModal === 'speech' && selectedStudent && (
                <SpeechAnalysisModal
                    studentId={selectedStudent}
                    studentName={getSelectedStudentName()}
                    onClose={closeModal}
                />
            )}

            {activeModal === 'behavior' && selectedStudent && (
                <BehaviorAnalysisModal
                    studentId={selectedStudent}
                    studentName={getSelectedStudentName()}
                    onClose={closeModal}
                />
            )}

            {activeModal === 'emotion' && selectedStudent && (
                <EmotionDetectionModal
                    studentId={selectedStudent}
                    studentName={getSelectedStudentName()}
                    onClose={closeModal}
                />
            )}

            {activeModal === 'progress' && selectedStudent && (
                <ProgressPredictionModal
                    studentId={selectedStudent}
                    studentName={getSelectedStudentName()}
                    onClose={closeModal}
                />
            )}

            {activeModal === 'risk' && selectedStudent && (
                <RiskDetectionModal
                    studentId={selectedStudent}
                    studentName={getSelectedStudentName()}
                    onClose={closeModal}
                />
            )}
        </div>
    );
}
