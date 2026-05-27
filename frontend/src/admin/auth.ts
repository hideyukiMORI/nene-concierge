const TOKEN_KEY = 'nene_admin_token';
const EMAIL_KEY = 'nene_admin_email';

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredEmail(): string | null {
    return localStorage.getItem(EMAIL_KEY);
}
export function setStoredEmail(email: string): void {
    localStorage.setItem(EMAIL_KEY, email);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}
