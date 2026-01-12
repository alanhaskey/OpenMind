import { createI18n } from 'vue-i18n';
import zh from './locales/zh.json';
import en from './locales/en.json';

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: localStorage.getItem('selected_language') === 'English' ? 'en' : 'zh', // Initial locale
  fallbackLocale: 'zh',
  messages: {
    zh,
    en,
    '中文': zh, // Alias for backward compatibility if needed
    'English': en // Alias
  }
});

export default i18n;
