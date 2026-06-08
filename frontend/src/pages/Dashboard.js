import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { analyticsApi, wasteApi } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const StatCard = ({ label, value, unit, color }) => (
  <div style={{
    background: '#fff', borderRadius: 10, padding: '1.25rem 1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`
  }}>
    <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>{label}</p>
    <p style={{ fontSize: '2rem', fontWeight: 700, color: '#1a3c2e', margin: '0.25rem 0 0' }}>
      {value} <span style={{ fontSize: '1rem', color: '#666' }}>{unit}</span>
    </p>
  </div>
);

export default function Dashboard() {
  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: () => analyticsApi.getOverview() });
  const { data: daily }    = useQuery({ queryKey: ['daily'],    queryFn: () => wasteApi.getDailySummary() });
  const { data: forecast } = useQuery({ queryKey: ['forecast'], queryFn: analyticsApi.getForecast });

  const s = overview?.summary || {};

  const dailyChart = {
    labels: daily?.map(d => d.date) || [],
    datasets: [{
      label: 'Daily Waste (kg)',
      data: daily?.map(d => parseFloat(d.total_kg)) || [],
      borderColor: '#2e6649', backgroundColor: 'rgba(46,102,73,0.1)',
      fill: true, tension: 0.4
    }]
  };

  const forecastChart = {
    labels: forecast?.map(f => f.date) || [],
    datasets: [{
      label: 'Predicted Demand (servings)',
      data: forecast?.map(f => f.predicted_servings) || [],
      backgroundColor: 'rgba(76,175,130,0.7)'
    }]
  };

  return (
    <div>
      <h1 style={{ color: '#1a3c2e', marginBottom: '1.5rem' }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="Total Waste (30d)" value={s.total_waste_kg ?? '—'} unit="kg"  color="#2e6649" />
        <StatCard label="Est. Cost Lost"    value={s.estimated_cost_usd ?? '—'} unit="$" color="#e57c2e" />
        <StatCard label="Avg per Entry"     value={s.avg_waste_per_entry ?? '—'} unit="kg" color="#4caf82" />
        <StatCard label="Total Entries"     value={s.total_entries ?? '—'}      unit=""    color="#5b8dd9" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginBottom: '1rem', color: '#1a3c2e' }}>Waste Trend (30 days)</h3>
          <Line data={dailyChart} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ marginBottom: '1rem', color: '#1a3c2e' }}>Demand Forecast (next 7 days)</h3>
          <Bar data={forecastChart} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>
      {overview?.top_waste_meals?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: '#1a3c2e' }}>Top Wasted Meals</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Meal</th>
                <th style={{ textAlign: 'right', padding: '0.5rem', color: '#666' }}>Waste (kg)</th>
              </tr>
            </thead>
            <tbody>
              {overview.top_waste_meals.map((m) => (
                <tr key={m.name} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '0.5rem' }}>{m.name}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', color: '#e57c2e', fontWeight: 600 }}>{m.waste_kg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
