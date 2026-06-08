import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/authStore';

const NAV = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/waste',     label: '🗑️ Waste Logs' },
  { to: '/analytics', label: '📈 Analytics' },
  { to: '/meals',     label: '🍽️ Meals' },
  { to: '/alerts',    label: '🔔 Alerts' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: 220, background: '#1a3c2e', color: '#fff', padding: '1.5rem 1rem' }}>
        <h2 style={{ color: '#4caf82', marginBottom: '0.25rem', fontSize: '1.3rem' }}>🌿 CampusEats</h2>
        <p style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '2rem' }}>Food Waste Tracker</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {NAV.map(({ to, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              padding: '0.6rem 1rem',
              borderRadius: 6,
              textDecoration: 'none',
              color: isActive ? '#fff' : '#bbb',
              background: isActive ? '#2e6649' : 'transparent',
              fontWeight: isActive ? 600 : 400,
            })}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: '1.5rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#aaa' }}>{user?.name}</p>
          <button onClick={handleLogout} style={{
            background: 'none', border: '1px solid #555', color: '#aaa',
            padding: '0.4rem 1rem', borderRadius: 4, cursor: 'pointer', marginTop: '0.5rem'
          }}>Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '2rem', background: '#f5f7f5', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
