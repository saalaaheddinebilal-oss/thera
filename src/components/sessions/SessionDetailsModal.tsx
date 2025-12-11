import { useLanguage } from '../../contexts/LanguageContext';
import { X } from 'lucide-react';

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

interface SessionDetailsModalProps {
  session: Session;
  onClose: () => void;
  onUpdate: () => void;
}

export function SessionDetailsModal({ session, onClose }: SessionDetailsModalProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('sessions.sessionDetails')}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-600">{t('students.fullName')}</span>
            <p className="text-lg font-semibold text-gray-900 mt-1">{session.student_name || 'Student'}</p>
          </div>

          <div>
            <span className="text-sm font-medium text-gray-600">{t('sessions.sessionDate')}</span>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {new Date(session.session_date).toLocaleString()}
            </p>
          </div>

          {session.duration_minutes && (
            <div>
              <span className="text-sm font-medium text-gray-600">{t('sessions.duration')}</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {session.duration_minutes} {t('sessions.minutes')}
              </p>
            </div>
          )}

          {session.focus_area && (
            <div>
              <span className="text-sm font-medium text-gray-600">{t('sessions.focusArea')}</span>
              <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                {t(`sessions.${session.focus_area}`)}
              </p>
            </div>
          )}

          <div>
            <span className="text-sm font-medium text-gray-600">{t('sessions.status')}</span>
            <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
              {t(`sessions.${session.status}`)}
            </p>
          </div>

          {session.therapist_name && (
            <div>
              <span className="text-sm font-medium text-gray-600">{t('students.primaryTherapist')}</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">{session.therapist_name}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
