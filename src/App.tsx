import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthPage } from './pages/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ParentDashboard } from './components/dashboards/ParentDashboard';
import { TherapistDashboard } from './components/dashboards/TherapistDashboard';
import { SchoolDashboard } from './components/dashboards/SchoolDashboard';
import { StudentsPage } from './pages/StudentsPage';
import { SessionsPage } from './pages/SessionsPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProgressPage } from './pages/ProgressPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { IEPPlansPage } from './pages/IEPPlansPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { t } = useLanguage();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        switch (profile.role) {
          case 'parent':
            return <ParentDashboard />;
          case 'therapist':
            return <TherapistDashboard />;
          case 'school_admin':
            return <SchoolDashboard />;
          default:
            return <div className="p-8">Invalid role</div>;
        }
      case 'students':
      case 'children':
        return <StudentsPage />;
      case 'sessions':
        return <SessionsPage />;
      case 'messages':
        return <MessagesPage />;
      case 'progress':
        return <ProgressPage />;
      case 'recommendations':
        return <RecommendationsPage />;
      case 'iep':
        return <IEPPlansPage />;
      case 'ai-analysis':
        return <AIAnalysisPage />;
      default:
        return (
            <div className="p-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                </h2>
                <p className="text-gray-600">This feature is under development</p>
              </div>
            </div>
        );
    }
  };

  return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {renderPage()}
          </main>
        </div>
      </div>
  );
}

function App() {
  return (
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
  );
}

export default App;
