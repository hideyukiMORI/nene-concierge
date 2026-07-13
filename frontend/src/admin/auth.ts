const TOKEN_KEY = 'nene_admin_token';
const EMAIL_KEY = 'nene_admin_email';

// XSS 時の窃取面を減らすため sessionStorage を使用する (タブ/ウィンドウを閉じると消える)。
// localStorage はタブ間で永続し窃取面が広いため使用しない。

export function getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
}

export function getStoredEmail(): string | null {
    return sessionStorage.getItem(EMAIL_KEY);
}
export function setStoredEmail(email: string): void {
    sessionStorage.setItem(EMAIL_KEY, email);
}

export function clearToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}
