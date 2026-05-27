import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import { I18nProvider, applyLocaleFontFamily, resolveLocale } from './i18n/index.js';
import { detectAdminTheme, applyAdminTheme } from './theme/index.js';
import './fonts.js';

// FOUC 防止: React レンダリング前にロケール検出してフォントを即適用する。
// (I18nProvider 内でも同じ処理をするが、こちらが先に動く)
// nene-records main.tsx と同パターン。
const storedLocale = (() => {
    try {
        return localStorage.getItem('nca-locale') ?? navigator.language;
    } catch {
        return navigator.language;
    }
})();
const initialLocale = resolveLocale(storedLocale);
document.documentElement.lang = initialLocale;
applyLocaleFontFamily(initialLocale);

// テーマ FOUC 防止
const { id: themeId, variant: themeVariant } = detectAdminTheme();
applyAdminTheme(themeId, themeVariant);

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

createRoot(container).render(
    <StrictMode>
        <I18nProvider>
            <App />
        </I18nProvider>
    </StrictMode>,
);
