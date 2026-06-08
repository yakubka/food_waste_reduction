import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { analyticsApi } from '../services/api';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Analytics() {
  const { data: overview }   = useQuery({ queryKey: ['overview'],  queryFn: analyticsApi.getOverview });
  const { data: reduction }  = useQuery({ queryKey: ['reduction'], queryFn: analyticsApi.getReduction });

  const reductionChart = {
    labels: reduction?.map(r => r.week?.split('T')[0]) || [],
    datasets: [{
      label: 'Waste (kg) per week',
      data: reduction?.map(r => parseFloat(r.total_kg)) || [],
      borderColor: '#2e6649', backgroundColor: 'rgba(46,102,73,0.15)', fill: true, tension: 0.4
    }]
  };

  const hourData = overview?.waste_by_hour || [];
  const peakChart = {
    labels: hourData.map(h => `${h.hour}:00`),
    datasets: [{
      label: 'Waste by Hour (kg)',
      data: hourData.map(h => parseFloat(h.waste_kg)),
      borderColor: '#e57c2e', backgroundColor: 'rgba(229,124,46,0.15)', fill: true, tension: 0.3
    }]
  };

  return (
    <div>
      <h1 style={{ color: '#1a3c2e', marginBottom: '1.5rem' }}>Analytics</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ color: '#1a3c2e', marginBottom: '1rem' }}>Weekly Waste Reduction Trend</h3>
          <Line data={reductionChart} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
        <div style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ color: '#1a3c2e', marginBottom: '1rem' }}>Peak Waste Hours</h3>
          <Line data={peakChart} options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
        </div>
      </div>
      {overview?.top_waste_meals && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', maxWidth: 400 }}>
          <h3 style={{ color: '#1a3c2e', marginBottom: '1rem' }}>Top Wasted Meals</h3>
          <Doughnut
            data={{
              labels: overview.top_waste_meals.map(m => m.name),
              datasets: [{
                data: overview.top_waste_meals.map(m => m.waste_kg),
                backgroundColor: ['#2e6649','#4caf82','#e57c2e','#5b8dd9','#f4d35e']
              }]
            }}
            options={{ plugins: { legend: { position: 'bottom' } } }}
          />
        </div>
      )}
    </div>
  );
}
