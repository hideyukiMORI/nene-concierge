/**
 * ModalProvider — useModals() を提供する Context Provider。
 * App.tsx 直下に配置する。複数モーダルを同時表示できる (stack)。
 *
 * 使い方:
 *   const { confirm, alertDialog } = useModals();
 *   const ok = await confirm({ title: '削除しますか?', tone: 'danger' });
 *   if (!ok) return;
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, type ConfirmOptions, type AlertOptions, type ModalState } from './Modal.js';

interface ModalApi {
    confirm:     (opts: ConfirmOptions) => Promise<boolean>;
    alertDialog: (opts: AlertOptions)   => Promise<void>;
}

const ModalContext = createContext<ModalApi | null>(null);

export function useModals(): ModalApi {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error('useModals must be used within ModalProvider');
    return ctx;
}

let uid = 0;
const nextId = () => `m-${Date.now()}-${uid++}`;

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [stack, setStack] = useState<ModalState[]>([]);

    const dismiss = useCallback((id: string) => {
        setStack(s => s.filter(m => m.id !== id));
    }, []);

    const confirm = useCallback((opts: ConfirmOptions) => {
        return new Promise<boolean>(resolve => {
            const id = nextId();
            setStack(s => [...s, {
                ...opts, id, kind: 'confirm',
                resolve: (v: boolean) => { resolve(v); dismiss(id); },
            }]);
        });
    }, [dismiss]);

    const alertDialog = useCallback((opts: AlertOptions) => {
        return new Promise<void>(resolve => {
            const id = nextId();
            setStack(s => [...s, {
                ...opts, id, kind: 'alert',
                resolve: () => { resolve(); dismiss(id); },
            }]);
        });
    }, [dismiss]);

    const api = useMemo<ModalApi>(() => ({ confirm, alertDialog }), [confirm, alertDialog]);

    return (
        <ModalContext.Provider value={api}>
            {children}
            {stack.map(m => <Modal key={m.id} state={m}/>)}
        </ModalContext.Provider>
    );
}
