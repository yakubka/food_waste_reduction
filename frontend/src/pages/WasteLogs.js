import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { wasteApi, mealsApi } from '../services/api';

export default function WasteLogs() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ meal_id: '', weight_kg: '', source: 'manual', notes: '' });
  const { data: logs, isLoading } = useQuery({ queryKey: ['waste-logs'], queryFn: () => wasteApi.getLogs({ limit: 50 }) });
  const { data: meals } = useQuery({ queryKey: ['meals'], queryFn: () => mealsApi.list() });

  const mutation = useMutation({
    mutationFn: wasteApi.logWaste,
    onSuccess: () => {
      toast.success('Waste entry logged');
      qc.invalidateQueries({ queryKey: ['waste-logs'] });
      setForm({ meal_id: '', weight_kg: '', source: 'manual', notes: '' });
    },
    onError: (e) => toast.error(String(e))
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, weight_kg: parseFloat(form.weight_kg) });
  };

  return (
    <div>
      <h1 style={{ color: '#1a3c2e', marginBottom: '1.5rem' }}>Waste Logs</h1>
      <div style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1a3c2e' }}>Log New Entry</h3>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <select value={form.meal_id} onChange={e => setForm(f => ({ ...f, meal_id: e.target.value }))}
            required style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: 6 }}>
            <option value="">Select meal…</option>
            {meals?.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input type="number" step="0.001" min="0" placeholder="Weight (kg)" required
            value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
            style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: 6 }} />
          <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: 6 }}>
            <option value="manual">Manual</option>
            <option value="scale">IoT Scale</option>
          </select>
          <input type="text" placeholder="Notes (optional)"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            style={{ padding: '0.6rem', border: '1px solid #ddd', borderRadius: 6 }} />
          <button type="submit" disabled={mutation.isPending} style={{
            gridColumn: '1/-1', padding: '0.75rem', background: '#2e6649',
            color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600
          }}>
            {mutation.isPending ? 'Logging…' : 'Log Waste Entry'}
          </button>
        </form>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f5f7f5' }}>
            <tr>
              {['Meal', 'Category', 'Weight (kg)', 'Source', 'Date'].map(h => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#555', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>Loading…</td></tr>
            ) : logs?.map(log => (
              <tr key={log.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '0.75rem 1rem' }}>{log.meal_name}</td>
                <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{log.category}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#e57c2e', fontWeight: 600 }}>{log.weight_kg}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{ background: log.source === 'scale' ? '#e8f5e9' : '#fff3e0', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem' }}>
                    {log.source}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#888', fontSize: '0.9rem' }}>
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
