import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { sessionsAPI, studentsAPI } from '../lib/api';
import { Plus, Calendar, Clock, User, Filter } from 'lucide-react';
import { ScheduleSessionModal } from '../components/sessions/ScheduleSessionModal';
import { SessionDetailsModal } from '../components/sessions/SessionDetailsModal';

interface Session {
  id: string;
  student_id: string;
  therapist_id: string;
  session_date: string;
  duration_minutes: number | null;
  focus_area: string | null;
  status: string;
  video_url: string | null;
  student_name?: string;
  therapist_name?: string;
}

export function SessionsPage() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const data = await sessionsAPI.getAll();
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredSessions = sessions.filter((session) => {
    if (filterStatus === 'all') return true;
    return session.status === filterStatus;
  });

  const groupedSessions = filteredSessions.reduce((acc, session) => {
    const date = new Date(session.session_date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFocusAreaColor = (focusArea: string) => {
    switch (focusArea) {
      case 'academic':
        return 'bg-blue-50 text-blue-700';
      case 'emotional':
        return 'bg-purple-50 text-purple-700';
      case 'linguistic':
        return 'bg-green-50 text-green-700';
      case 'sensory':
        return 'bg-orange-50 text-orange-700';
      case 'behavioral':
        return 'bg-red-50 text-red-700';
      case 'life_skills':
        return 'bg-cyan-50 text-cyan-700';
      default:
        return 'bg-gray-50 text-gray-700';
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
          <h1 className="text-3xl font-bold text-gray-900">{t('sessions.title')}</h1>
          <p className="text-gray-600 mt-2">{t('sessions.sessionList')}</p>
        </div>
        {profile?.role !== 'parent' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('sessions.scheduleSession')}
          </button>
        )}
      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">{t('sessions.status')}:</span>
        </div>
        <div className="flex gap-2">
          {['all', 'scheduled', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? t('common.all') : t(`sessions.${status}`)}
            </button>
          ))}
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('sessions.noSessions')}</h3>
          <p className="text-gray-600 mb-6">{t('sessions.scheduleSession')}</p>
          {profile?.role !== 'parent' && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('sessions.scheduleSession')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSessions).map(([date, dateSessions]) => (
            <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">{date}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {dateSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-lg font-bold">
                          {session.student_name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{session.student_name || 'Student'}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                              {t(`sessions.${session.status}`)}
                            </span>
                            {session.focus_area && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFocusAreaColor(session.focus_area)}`}>
                                {t(`sessions.${session.focus_area}`)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(session.session_date).toLocaleTimeString()}</span>
                            </div>
                            {session.duration_minutes && (
                              <span>{session.duration_minutes} {t('sessions.minutes')}</span>
                            )}
                            {session.therapist_name && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{session.therapist_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showScheduleModal && (
        <ScheduleSessionModal
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false);
            loadSessions();
          }}
        />
      )}

      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onUpdate={loadSessions}
        />
      )}
    </div>
  );
}
