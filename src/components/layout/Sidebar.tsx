import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Brain,
  School,
  Activity,
  Target
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'parent':
        return [
          { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
          { id: 'children', labelKey: 'nav.children', icon: Users },
          { id: 'progress', labelKey: 'nav.progress', icon: Activity },
          { id: 'sessions', labelKey: 'nav.sessions', icon: Calendar },
          { id: 'recommendations', labelKey: 'nav.recommendations', icon: Target },
          { id: 'messages', labelKey: 'nav.messages', icon: MessageSquare },
        ];
      case 'therapist':
        return [
          { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
          { id: 'students', labelKey: 'nav.students', icon: Users },
          { id: 'sessions', labelKey: 'nav.sessions', icon: Calendar },
          { id: 'assessments', labelKey: 'nav.assessments', icon: FileText },
          { id: 'iep', labelKey: 'nav.iep', icon: Target },
          { id: 'ai-analysis', labelKey: 'nav.aiAnalysis', icon: Brain },
          { id: 'messages', labelKey: 'nav.messages', icon: MessageSquare },
        ];
      case 'school_admin':
        return [
          { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
          { id: 'school', labelKey: 'nav.school', icon: School },
          { id: 'students', labelKey: 'nav.students', icon: Users },
          { id: 'staff', labelKey: 'nav.staff', icon: Users },
          { id: 'reports', labelKey: 'nav.reports', icon: FileText },
          { id: 'messages', labelKey: 'nav.messages', icon: MessageSquare },
        ];
      case 'system_admin':
        return [
          { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
          { id: 'ai-training', labelKey: 'nav.aiTraining', icon: Brain },
          { id: 'messages', labelKey: 'nav.messages', icon: MessageSquare },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{t('auth.platformTitle')}</h2>
            <p className="text-xs text-gray-500 capitalize">{t(`auth.${profile?.role}`)}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activePage === item.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-1">
        <button
          onClick={() => onNavigate('settings')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium text-sm">{t('nav.settings')}</span>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">{t('auth.signOut')}</span>
        </button>
      </div>
    </div>
  );
}
