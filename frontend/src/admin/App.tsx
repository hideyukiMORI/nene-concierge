import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router';
import { isAuthenticated } from './auth.js';
import { ThemeProvider } from './theme/index.js';
import Layout from './components/Layout.js';
import LoginPage         from './components/LoginPage.js';
import ScenariosPage     from './components/ScenariosPage.js';
import ScenarioFormPage  from './components/ScenarioFormPage.js';
import AppearancePage    from './components/AppearancePage.js';
import CredentialsPage   from './components/CredentialsPage.js';
import SettingsPage      from './components/SettingsPage.js';

function RequireAuth() {
    if (!isAuthenticated()) return <Navigate to="/" replace />;
    return <Outlet />;
}

export default function App() {
    return (
        <ThemeProvider>
        <BrowserRouter basename="/admin">
            <Routes>
                {/* Public */}
                <Route index element={
                    isAuthenticated()
                        ? <Navigate to="/scenarios" replace />
                        : <LoginPage />
                } />

                {/* Protected */}
                <Route element={<RequireAuth />}>
                    <Route element={<Layout />}>
                        <Route path="scenarios"      element={<ScenariosPage />} />
                        <Route path="scenarios/new"  element={<ScenarioFormPage />} />
                        <Route path="scenarios/:id"  element={<ScenarioFormPage />} />
                        <Route path="appearance"     element={<AppearancePage />} />
                        <Route path="credentials"    element={<CredentialsPage />} />
                        <Route path="settings"       element={<SettingsPage />} />
                    </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
        </ThemeProvider>
    );
}
