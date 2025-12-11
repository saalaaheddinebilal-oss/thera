import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { studentsAPI, aiAPI } from '../../lib/api';
import { X, Calendar, User, Phone, FileText, Brain, TrendingUp, Activity } from 'lucide-react';

interface Student {
  id: string;
  full_name: string;
  date_of_birth: string;
  gender: string | null;
  parent_id: string;
  primary_therapist_id: string | null;
  avatar_url: string | null;
  emergency_contact: string | null;
  medical_notes: string | null;
  created_at: string;
}

interface StudentDetailsModalProps {
  student: Student;
  onClose: () => void;
  onUpdate: () => void;
}

interface StudentStats {
  overallProgress: number;
  activeGoals: number;
  completedGoals: number;
  totalSessions: number;
}

export function StudentDetailsModal({ student, onClose, onUpdate }: StudentDetailsModalProps) {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [formData, setFormData] = useState({
    fullName: student.full_name,
    dateOfBirth: student.date_of_birth,
    gender: student.gender || 'male',
    emergencyContact: student.emergency_contact || '',
    medicalNotes: student.medical_notes || '',
  });

  useEffect(() => {
    loadStats();
  }, [student.id]);

  async function loadStats() {
    try {
      const data = await studentsAPI.getStats(student.id);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  async function handleUpdate() {
    setLoading(true);
    try {
      await studentsAPI.update(student.id, {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        emergencyContact: formData.emergencyContact,
        medicalNotes: formData.medicalNotes,
      });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating student:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateIEP() {
    setLoading(true);
    try {
      await aiAPI.generateIEP(student.id);
      alert(t('iep.createIEP') + ' - ' + t('ai.analysisComplete'));
    } catch (error) {
      console.error('Error generating IEP:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {student.full_name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
                <p className="text-gray-600">
                  {calculateAge(student.date_of_birth)} {t('dashboard.years')}
                </p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">{t('dashboard.overallProgress')}</span>
                </div>
                {loadingStats ? (
                    <p className="text-sm text-gray-600">{t('common.loading')}</p>
                ) : (
                    <>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats ? Math.round(stats.overallProgress) : 0}%
                      </p>
                      <p className="text-sm text-gray-600">{t('progress.lastMonth')}</p>
                    </>
                )}
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-900">{t('dashboard.activeGoals')}</span>
                </div>
                {loadingStats ? (
                    <p className="text-sm text-gray-600">{t('common.loading')}</p>
                ) : (
                    <>
                      <p className="text-2xl font-bold text-green-600">{stats?.activeGoals || 0}</p>
                      <p className="text-sm text-gray-600">
                        {stats?.completedGoals || 0} {t('dashboard.completed')}
                      </p>
                    </>
                )}
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <span className="font-semibold text-gray-900">{t('sessions.title')}</span>
                </div>
                {loadingStats ? (
                    <p className="text-sm text-gray-600">{t('common.loading')}</p>
                ) : (
                    <>
                      <p className="text-2xl font-bold text-purple-600">{stats?.totalSessions || 0}</p>
                      <p className="text-sm text-gray-600">{t('dashboard.completed')}</p>
                    </>
                )}
              </div>
            </div>

            {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('students.fullName')}
                    </label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('students.dateOfBirth')}
                      </label>
                      <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('students.gender')}
                      </label>
                      <select
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="male">{t('students.male')}</option>
                        <option value="female">{t('students.female')}</option>
                        <option value="other">{t('students.other')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('students.emergencyContact')}
                    </label>
                    <input
                        type="text"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('students.medicalNotes')}
                    </label>
                    <textarea
                        value={formData.medicalNotes}
                        onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? t('common.loading') : t('common.save')}
                    </button>
                  </div>
                </div>
            ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">{t('students.dateOfBirth')}</span>
                        </div>
                        <p className="text-gray-900 font-medium">
                          {new Date(student.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">{t('students.gender')}</span>
                        </div>
                        <p className="text-gray-900 font-medium capitalize">
                          {student.gender ? t(`students.${student.gender}`) : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {student.emergency_contact && (
                          <div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm font-medium">{t('students.emergencyContact')}</span>
                            </div>
                            <p className="text-gray-900 font-medium">{student.emergency_contact}</p>
                          </div>
                      )}

                      {student.medical_notes && (
                          <div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">{t('students.medicalNotes')}</span>
                            </div>
                            <p className="text-gray-900">{student.medical_notes}</p>
                          </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    {profile?.role !== 'parent' && (
                        <>
                          <button
                              onClick={() => setIsEditing(true)}
                              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('common.edit')}
                          </button>
                          <button
                              onClick={handleGenerateIEP}
                              disabled={loading}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            <Brain className="w-5 h-5" />
                            {loading ? t('common.loading') : t('iep.generateWithAI')}
                          </button>
                        </>
                    )}
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
