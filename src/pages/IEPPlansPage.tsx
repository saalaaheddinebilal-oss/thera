import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, FileText, Calendar, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { CreateIEPModal } from '../components/iep/CreateIEPModal';

interface IEPPlan {
    id: string;
    student_id: string;
    student_name?: string;
    start_date: string;
    end_date: string;
    goals: any;
    accommodations: any;
    status: string;
    created_at: string;
}

export function IEPPlansPage() {
    const { t } = useLanguage();
    const { profile } = useAuth();
    const [iepPlans, setIepPlans] = useState<IEPPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        loadIEPPlans();
    }, []);

    async function loadIEPPlans() {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/iep/plans`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setIepPlans(data || []);
            }
        } catch (error) {
            console.error('Error loading IEP plans:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredPlans = iepPlans.filter((plan) => {
        if (filterStatus === 'all') return true;
        return plan.status === filterStatus;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'expired':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'draft':
                return <FileText className="w-5 h-5 text-gray-600" />;
            default:
                return <FileText className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'expired':
                return 'bg-red-100 text-red-800';
            case 'draft':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
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
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('iep.title')}</h1>
                    <p className="text-gray-600 mt-2">{t('iep.iepList')}</p>
                </div>
                {profile?.role !== 'parent' && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        {t('iep.createIEP')}
                    </button>
                )}
            </div>

            <div className="mb-6 flex items-center gap-4">
                {['all', 'active', 'expired', 'draft'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filterStatus === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        {status === 'all' ? t('common.all') : t(`iep.${status}`)}
                    </button>
                ))}
            </div>

            {filteredPlans.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('iep.noIEPs')}</h3>
                    <p className="text-gray-600 mb-6">
                        {profile?.role === 'parent'
                            ? 'Your therapist will create IEP plans for your child'
                            : 'Create your first IEP plan to start tracking goals'}
                    </p>
                    {profile?.role !== 'parent' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {t('iep.createIEP')}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(plan.status)}
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{plan.student_name || 'Student'}</h3>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {t(`iep.${plan.status}`)}
                    </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                    {new Date(plan.start_date).toLocaleDateString()} - {new Date(plan.end_date).toLocaleDateString()}
                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Target className="w-4 h-4" />
                                    <span>{Object.keys(plan.goals || {}).length} {t('iep.goals')}</span>
                                </div>
                            </div>

                            <button className="w-full px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                                {t('students.viewDetails')}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <CreateIEPModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadIEPPlans();
                    }}
                />
            )}
        </div>
    );
}
