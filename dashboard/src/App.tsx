import { useState, useEffect } from 'react';
import type { Alert, Severity } from './types';
import { Shield, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial alerts
  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:3000/alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch initial alerts', err);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const evtSource = new EventSource('http://localhost:3000/alerts/stream');

    evtSource.onopen = () => setIsConnected(true);
    evtSource.onerror = () => setIsConnected(false);

    evtSource.onmessage = (event) => {
      const newAlert: Alert = JSON.parse(event.data);
      setAlerts((prev) => {
        // Prevent duplicates
        if (prev.some((a) => a.id === newAlert.id)) return prev;
        return [newAlert, ...prev];
      });
    };

    return () => evtSource.close();
  }, []);

  const clearAlerts = () => setAlerts([]);

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.severity === filter);

  return (
    <>
      <header className="app-header">
        <div className="brand">
          <Shield className="brand-icon" size={28} />
          <h1 className="brand-title">
            SentinelAPI 
            <span className="brand-subtitle">Intrusion Detection Dashboard</span>
          </h1>
        </div>
        
        <div className="status-indicator">
          <div className={`pulse-dot ${isConnected ? 'active' : 'error'}`} />
          <span>{isConnected ? 'Live Monitoring Active' : 'Connection Lost'}</span>
        </div>
      </header>

      <main className="main-content">
        <div className="controls-bar">
          <select 
            className="select-input" 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as Severity | 'all')}
          >
            <option value="all">All Severities</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
          
          <button className="btn" onClick={fetchAlerts}>
            <RefreshCw size={16} />
            Refresh
          </button>
          
          <button className="btn" onClick={clearAlerts}>
            <Trash2 size={16} />
            Clear View
          </button>
        </div>

        <div className="glass-panel table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Detector</th>
                <th>Severity</th>
                <th>Source IP</th>
                <th>Path</th>
                <th>Reason</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <CheckCircle2 size={48} className="empty-icon" />
                      <div>
                        <h3>System Secure</h3>
                        <p>No alerts match the current criteria.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, idx) => (
                  <tr key={alert.id} className={idx === 0 ? 'row-new' : ''}>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {format(new Date(alert.timestamp), 'HH:mm:ss.SSS')}
                    </td>
                    <td style={{ fontWeight: 600 }}>{alert.detector_name}</td>
                    <td>
                      <span className={`badge ${alert.severity}`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td>
                      <span className="code-block">{alert.source_ip}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {alert.request_path}
                    </td>
                    <td>{alert.reason}</td>
                    <td className="payload-cell">
                      {alert.matched_payload ? (
                        <span 
                          className="code-block payload-truncate"
                          title={alert.matched_payload}
                        >
                          {alert.matched_payload}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

export default App;
