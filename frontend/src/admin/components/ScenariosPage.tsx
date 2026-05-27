import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listScenarios, deleteScenario, ScenarioSummary, ApiError } from '../api.js';
import { PageTitle, Card, Btn, Badge, ErrorMsg } from './Layout.js';
import { T } from '../theme.js';
import { useTranslation } from '../i18n/index.js';

export default function ScenariosPage() {
    const { t } = useTranslation();
    const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await listScenarios();
            setScenarios(res.data);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : t('scenarios.loadError'));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { void load(); }, []);

    async function handleDelete(id: number, name: string) {
        if (!confirm(t('scenarios.confirmDelete', { name }))) return;
        try {
            await deleteScenario(id);
            setScenarios(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert(err instanceof ApiError ? err.message : t('scenarios.deleteError'));
        }
    }

    return (
        <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <PageTitle>{t('scenarios.pageTitle')}</PageTitle>
                <Link to="/scenarios/new">
                    <Btn>{t('common.new')}</Btn>
                </Link>
            </div>
            <ErrorMsg msg={error} />
            {loading ? (
                <p style={{ color: T.textMuted }}>{t('common.loading')}</p>
            ) : scenarios.length === 0 ? (
                <Card>
                    <p style={{ color: T.textMuted, textAlign:'center', padding:'40px 0' }}>
                        {t('scenarios.empty')}<br />
                        <span style={{ fontSize: T.fontSm }}>{t('scenarios.emptyHint')}</span>
                    </p>
                </Card>
            ) : (
                <Card style={{ padding: 0 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.borderLight}`, background: T.tableHeader }}>
                                {[
                                    t('common.id'),
                                    t('common.name'),
                                    t('common.description'),
                                    t('common.status'),
                                    t('common.actions'),
                                ].map(h => (
                                    <th key={h} style={{
                                        padding:'10px 16px', textAlign:'left',
                                        fontSize: T.fontSm, fontWeight: 600, color: T.textMuted,
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {scenarios.map(s => (
                                <tr key={s.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                                    <td style={{ padding:'12px 16px', color: T.textMuted, fontSize: T.fontBase }}>{s.id}</td>
                                    <td style={{ padding:'12px 16px', fontWeight:500 }}>
                                        <Link to={`/scenarios/${s.id}`} style={{ color: T.primary, textDecoration:'none' }}>
                                            {s.name}
                                        </Link>
                                    </td>
                                    <td style={{ padding:'12px 16px', color: T.textMuted, fontSize: T.fontBase, maxWidth:200 }}>
                                        {s.description ?? '—'}
                                    </td>
                                    <td style={{ padding:'12px 16px' }}>
                                        <Badge status={s.status} />
                                    </td>
                                    <td style={{ padding:'12px 16px' }}>
                                        <div style={{ display:'flex', gap:8 }}>
                                            <Link to={`/scenarios/${s.id}`}>
                                                <Btn variant="ghost">{t('common.edit')}</Btn>
                                            </Link>
                                            <Btn variant="danger" onClick={() => void handleDelete(s.id, s.name)}>
                                                {t('common.delete')}
                                            </Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}
        </div>
    );
}
