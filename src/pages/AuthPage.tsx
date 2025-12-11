import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LoginForm } from '../components/auth/LoginForm';
import { SignupForm } from '../components/auth/SignupForm';
import { Brain, Languages } from 'lucide-react';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { t, language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Languages className="w-5 h-5" />
              <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'AR'}</span>
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('auth.platformTitle')}
            </h1>
            <p className="text-gray-600 mt-2">
              {t('auth.platformSubtitle')}
            </p>
          </div>

          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                isLogin
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('auth.signIn')}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                !isLogin
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('auth.signUp')}
            </button>
          </div>

          {isLogin ? <LoginForm /> : <SignupForm />}
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          {t('auth.empoweringMessage')}
        </p>
      </div>
    </div>
  );
}
