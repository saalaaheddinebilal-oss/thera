import { useLanguage } from '../../contexts/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        <Languages className="w-5 h-5" />
        <span className="text-sm font-medium">{language === 'ar' ? 'EN' : 'AR'}</span>
      </button>
    </div>
  );
}
