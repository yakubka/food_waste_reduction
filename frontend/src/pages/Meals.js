import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { mealsApi } from '../services/api';

export default function Meals() {
  const { data: meals, isLoading } = useQuery({ queryKey: ['meals'], queryFn: () => mealsApi.list() });

  return (
    <div>
      <h1 style={{ color: '#1a3c2e', marginBottom: '1.5rem' }}>Meals</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: '1rem' }}>
        {isLoading ? <p>Loading…</p> : meals?.map(m => (
          <div key={m.id} style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ color: '#1a3c2e', margin: '0 0 0.25rem' }}>{m.name}</h3>
            <span style={{ background: '#e8f5e9', color: '#2e6649', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', textTransform: 'capitalize' }}>
              {m.category}
            </span>
            <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.75rem' }}>{m.description || 'No description'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.85rem', color: '#888' }}>
              <span>Serving: {m.serving_size_g}g</span>
              <span>${m.cost_per_serving}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
