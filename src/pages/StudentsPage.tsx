import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { studentsAPI, aiAPI } from '../lib/api';
import { Plus, Search, User, Calendar, Brain, Activity, Edit, Trash2 } from 'lucide-react';
import { AddStudentModal } from '../components/students/AddStudentModal';
import { StudentDetailsModal } from '../components/students/StudentDetailsModal';

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

export function StudentsPage() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await studentsAPI.getAll();
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter((student) =>
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-gray-900">{t('students.title')}</h1>
            <p className="text-gray-600 mt-2">
              {profile?.role === 'parent' ? t('nav.children') : t('students.studentList')}
            </p>
          </div>
          {profile?.role !== 'parent' && (
              <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {t('students.addStudent')}
              </button>
          )}
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('students.noStudents')}</h3>
              <p className="text-gray-600 mb-6">{t('students.noStudentsMessage')}</p>
              {profile?.role !== 'parent' && (
                  <button
                      onClick={() => setShowAddModal(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('students.addStudent')}
                  </button>
              )}
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                  <div
                      key={student.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                        {student.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{student.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                      {calculateAge(student.date_of_birth)} {t('dashboard.years')}
                    </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center py-3 text-gray-500 text-sm border-t border-gray-200 mt-4">
                      {t('students.viewDetails')}
                    </div>

                    {profile?.role !== 'parent' && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                          <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            {t('common.edit')}
                          </button>
                        </div>
                    )}
                  </div>
              ))}
            </div>
        )}

        {showAddModal && (
            <AddStudentModal
                onClose={() => setShowAddModal(false)}
                onSuccess={() => {
                  setShowAddModal(false);
                  loadStudents();
                }}
            />
        )}

        {selectedStudent && (
            <StudentDetailsModal
                student={selectedStudent}
                onClose={() => setSelectedStudent(null)}
                onUpdate={loadStudents}
            />
        )}
      </div>
  );
}
