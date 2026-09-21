import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Alert, Severity } from './types';
import { attacks } from './attacks';
import { Activity, BookOpen, CheckCircle2, ChevronRight, LayoutDashboard, LogOut, Menu, RefreshCw, Shield, ShieldAlert, UserRound, X } from 'lucide-react';
import { format } from 'date-fns';

const API = 'http://localhost:3000';
type User = { name: string; username: string; role: string };

function useHashRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || '/overview');
  useEffect(() => { const update = () => setRoute(location.hash.slice(1) || '/overview'); addEventListener('hashchange', update); return () => removeEventListener('hashchange', update); }, []);
  const navigate = (path: string) => { location.hash = path; };
  return { route, navigate };
}

function Login({ onLogin }: { onLogin: (token: string, user: User) => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('sentinel123');
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    if (!response.ok) return setError('Invalid demo credentials.');
    const data = await response.json(); onLogin(data.token, data.user);
  };
  return <div className="login-page"><div className="login-visual"><div><Shield size={52}/><p className="eyebrow">SentinelAPI</p><h1>See threats.<br/>Understand attacks.<br/>Respond faster.</h1><p>A real-time intrusion detection demonstration protecting a Node.js API.</p></div></div><form className="login-card" onSubmit={submit}><div className="login-mark"><Shield size={30}/></div><p className="eyebrow">Secure console</p><h2>Welcome back</h2><p className="muted">Sign in to open the monitoring workspace.</p><label>Username<input value={username} onChange={e => setUsername(e.target.value)}/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)}/></label>{error && <div className="error-box">{error}</div>}<button className="primary-btn" type="submit">Sign in <ChevronRight size={18}/></button><div className="demo-credentials"><strong>Demo access</strong><span>admin / sentinel123</span></div></form></div>;
}

function AlertTable({ alerts, empty = 'No alerts found.' }: { alerts: Alert[]; empty?: string }) {
  return <div className="glass-panel table-wrapper"><table className="alerts-table"><thead><tr><th>Time</th><th>Detector</th><th>Severity</th><th>Source</th><th>Path</th><th>Reason</th></tr></thead><tbody>{alerts.length ? alerts.map(a => <tr key={a.id}><td className="muted">{format(new Date(a.timestamp), 'MMM d, HH:mm:ss')}</td><td><strong>{a.detector_name}</strong></td><td><span className={`badge ${a.severity}`}>{a.severity}</span></td><td><span className="code-block">{a.source_ip}</span></td><td className="muted">{a.request_path}</td><td>{a.reason}</td></tr>) : <tr><td colSpan={6}><div className="empty-state"><CheckCircle2 size={42}/><h3>{empty}</h3></div></td></tr>}</tbody></table></div>;
}

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('sentinel-token') || '');
  const [user, setUser] = useState<User | null>(() => JSON.parse(sessionStorage.getItem('sentinel-user') || 'null'));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const { route, navigate } = useHashRoute();

  const fetchAlerts = async () => {
    if (!token) return;
    const response = await fetch(`${API}/alerts`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status === 401) return logout();
    if (response.ok) setAlerts(await response.json());
  };
  useEffect(() => { fetchAlerts(); if (!token) return; const source = new EventSource(`${API}/alerts/stream?token=${encodeURIComponent(token)}`); source.onopen = () => setConnected(true); source.onerror = () => setConnected(false); source.onmessage = e => { const alert = JSON.parse(e.data); setAlerts(current => current.some(a => a.id === alert.id) ? current : [alert, ...current]); }; return () => source.close(); }, [token]);
  const login = (newToken: string, newUser: User) => { sessionStorage.setItem('sentinel-token', newToken); sessionStorage.setItem('sentinel-user', JSON.stringify(newUser)); setToken(newToken); setUser(newUser); navigate('/overview'); };
  const logout = () => { sessionStorage.clear(); setToken(''); setUser(null); };
  const go = (path: string) => { navigate(path); setMenuOpen(false); };
  const counts = useMemo(() => ({ high: alerts.filter(a => a.severity === 'high').length, medium: alerts.filter(a => a.severity === 'medium').length, total: alerts.length, detectors: new Set(alerts.map(a => a.detector_name)).size }), [alerts]);
  if (!token || !user) return <Login onLogin={login}/>;

  const detailSlug = route.startsWith('/attacks/') ? route.split('/')[2] : '';
  const attack = attacks.find(item => item.slug === detailSlug);
  const title = route === '/overview' ? 'Security overview' : route === '/alerts' ? 'All security alerts' : route === '/attacks' ? 'Attack library' : attack?.name || 'Security console';
  const renderPage = () => {
    if (route === '/overview') return <><section className="hero-panel"><div><p className="eyebrow">Live security posture</p><h2>Your API is actively monitored</h2><p>Review detected threats and explore how each protection works.</p></div><ShieldAlert size={70}/></section><section className="metrics"><div><span>Total alerts</span><strong>{counts.total}</strong></div><div><span>High severity</span><strong className="red">{counts.high}</strong></div><div><span>Medium severity</span><strong className="amber">{counts.medium}</strong></div><div><span>Active detectors</span><strong>{counts.detectors}/11</strong></div></section><div className="section-heading"><div><p className="eyebrow">Latest activity</p><h3>Recent alerts</h3></div><button className="text-btn" onClick={() => go('/alerts')}>View all <ChevronRight size={16}/></button></div><AlertTable alerts={alerts.slice(0, 6)}/></>;
    if (route === '/alerts') return <><div className="page-intro"><p>Every threat recorded by Sentinel middleware, newest first.</p><div className="inline-actions"><select className="select-input" value={filter} onChange={e => setFilter(e.target.value as Severity | 'all')}><option value="all">All severities</option><option value="high">High severity</option><option value="medium">Medium severity</option></select><button className="btn" onClick={fetchAlerts}><RefreshCw size={16}/>Refresh</button></div></div><AlertTable alerts={filter === 'all' ? alerts : alerts.filter(a => a.severity === filter)}/></>;
    if (route === '/attacks') return <><div className="page-intro"><p>Explore the 11 protections implemented in this demonstration.</p></div><div className="attack-grid">{attacks.map((item, index) => <button className="attack-card" key={item.slug} onClick={() => go(`/attacks/${item.slug}`)}><span className="attack-number">{String(index + 1).padStart(2, '0')}</span><span className={`badge ${item.severity}`}>{item.category}</span><h3>{item.name}</h3><p>{item.summary}</p><span className="learn-link">View detector details <ChevronRight size={16}/></span></button>)}</div></>;
    if (attack) { const matches = alerts.filter(a => a.detector_name === attack.detector); return <><button className="back-link" onClick={() => go('/attacks')}>← Attack library</button><section className="detail-hero"><div><span className={`badge ${attack.severity}`}>{attack.category}</span><h2>{attack.name}</h2><p>{attack.summary}</p></div><div className="detail-count"><strong>{matches.length}</strong><span>detections</span></div></section><div className="detail-grid"><article><p className="eyebrow">Example payload</p><code>{attack.example}</code></article><article><p className="eyebrow">How Sentinel handles it</p><p>{attack.handling}</p></article><article><p className="eyebrow">Why it matters</p><p>{attack.importance}</p></article><article><p className="eyebrow">Real-world defense</p><p>{attack.defense}</p></article></div><div className="section-heading"><div><p className="eyebrow">User activity</p><h3>Alerts for this attack</h3></div></div><AlertTable alerts={matches} empty={`No ${attack.name} alerts recorded yet.`}/></>; }
    return <div className="empty-state"><h2>Page not found</h2><button className="primary-btn" onClick={() => go('/overview')}>Return home</button></div>;
  };

  return <div className="app-shell"><aside className={menuOpen ? 'sidebar open' : 'sidebar'}><div className="sidebar-brand"><Shield size={27}/><span>Sentinel<strong>API</strong></span><button className="close-menu" onClick={() => setMenuOpen(false)}><X/></button></div><nav><button className={route === '/overview' ? 'active' : ''} onClick={() => go('/overview')}><LayoutDashboard/>Overview</button><button className={route === '/alerts' ? 'active' : ''} onClick={() => go('/alerts')}><Activity/>All alerts <span>{alerts.length}</span></button><button className={route.startsWith('/attacks') ? 'active' : ''} onClick={() => go('/attacks')}><BookOpen/>Attack library</button></nav><div className="sidebar-user"><UserRound/><div><strong>{user.name}</strong><span>{user.role}</span></div><button title="Sign out" onClick={logout}><LogOut/></button></div></aside><main className="workspace"><header className="workspace-header"><button className="menu-btn" onClick={() => setMenuOpen(true)}><Menu/></button><div><p className="breadcrumb">SentinelAPI / Console</p><h1>{title}</h1></div><div className="live-pill"><i className={connected ? 'online' : ''}/>{connected ? 'Live monitoring' : 'Reconnecting'}</div></header><div className="page-content">{renderPage()}</div></main></div>;
}

export default App;
