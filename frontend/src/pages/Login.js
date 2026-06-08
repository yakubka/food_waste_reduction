import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../services/authStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, token } = await authApi.login(form);
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f0f5f1' }}>
      <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: 360 }}>
        <h1 style={{ color: '#1a3c2e', marginBottom: '0.25rem' }}>🌿 CampusEats</h1>
        <p style={{ color: '#777', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Smart Food Waste Reduction</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email" placeholder="Email" required
            value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '1rem' }}
          />
          <input
            type="password" placeholder="Password" required
            value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
            style={{ padding: '0.75rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '1rem' }}
          />
          <button type="submit" disabled={loading} style={{
            padding: '0.75rem', background: '#2e6649', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: '1rem', cursor: 'pointer',
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
