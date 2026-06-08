import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../services/api';

const SEVERITY_COLOR = { low: '#4caf82', medium: '#e57c2e', high: '#e53935' };

export default function Alerts() {
  const qc = useQueryClient();
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
  });

  const mutation = useMutation({
    mutationFn: alertsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] })
  });

  return (
    <div>
      <h1 style={{ color: '#1a3c2e', marginBottom: '1.5rem' }}>Alerts</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {isLoading ? <p>Loading…</p> : alerts?.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 10, padding: '2rem', textAlign: 'center', color: '#aaa' }}>
            No alerts — great work! 🎉
          </div>
        ) : alerts?.map(a => (
          <div key={a.id} style={{
            background: '#fff', borderRadius: 10, padding: '1rem 1.25rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${SEVERITY_COLOR[a.severity]}`,
            opacity: a.is_read ? 0.6 : 1
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ background: SEVERITY_COLOR[a.severity], color: '#fff', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.75rem', textTransform: 'uppercase', marginRight: '0.5rem' }}>
                  {a.severity}
                </span>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>{a.type}</span>
                <p style={{ margin: '0.5rem 0 0', color: '#333' }}>{a.message}</p>
                <p style={{ margin: '0.25rem 0 0', color: '#aaa', fontSize: '0.8rem' }}>{new Date(a.created_at).toLocaleString()}</p>
              </div>
              {!a.is_read && (
                <button onClick={() => mutation.mutate(a.id)} style={{
                  background: '#f5f5f5', border: 'none', borderRadius: 6,
                  padding: '0.4rem 0.75rem', cursor: 'pointer', color: '#555', fontSize: '0.8rem'
                }}>Mark read</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
