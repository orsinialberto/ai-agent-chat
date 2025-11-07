import React from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

interface ChartData {
  title?: string;
  type?: 'line' | 'bar' | 'pie' | 'area';
  data: any[];
  xKey?: string;
  yKey?: string;
  yKeys?: string[]; // Support for multiple lines/bars
  colors?: string[];
}

interface ChartRendererProps {
  chartData: ChartData;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ChartRendererComponent: React.FC<ChartRendererProps> = ({ chartData }) => {
  const { 
    title, 
    type = 'line', 
    data, 
    xKey = 'x', 
    yKey = 'y', 
    yKeys,
    colors = DEFAULT_COLORS 
  } = chartData;

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="my-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
        <p className="text-sm">⚠️ No data available for chart</p>
      </div>
    );
  }

  const renderChart = () => {
    // Determine which keys to render
    const keysToRender = yKeys || [yKey];

    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xKey} 
              stroke="#6b7280"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.875rem' }}
            />
            {keysToRender.map((key, index) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelStyle={{ fontSize: '0.75rem' }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.875rem' }}
            />
          </PieChart>
        );
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xKey} 
              stroke="#6b7280"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.875rem' }}
            />
            {keysToRender.map((key, index) => (
              <Area 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
          </AreaChart>
        );
      
      case 'line':
      default:
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={xKey} 
              stroke="#6b7280"
              style={{ fontSize: '0.75rem' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '0.75rem' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '0.875rem' }}
            />
            {keysToRender.map((key, index) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className="my-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

// Memoize ChartRenderer to prevent re-renders when props haven't changed
export const ChartRenderer = React.memo(ChartRendererComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders when data hasn't changed
  const prev = prevProps.chartData;
  const next = nextProps.chartData;
  
  // Compare primitive values
  if (
    prev.title !== next.title ||
    prev.type !== next.type ||
    prev.xKey !== next.xKey ||
    prev.yKey !== next.yKey
  ) {
    return false; // Props changed, should re-render
  }
  
  // Compare arrays using JSON.stringify (for yKeys and colors)
  const prevYKeys = JSON.stringify(prev.yKeys || []);
  const nextYKeys = JSON.stringify(next.yKeys || []);
  if (prevYKeys !== nextYKeys) {
    return false; // Props changed, should re-render
  }
  
  const prevColors = JSON.stringify(prev.colors || DEFAULT_COLORS);
  const nextColors = JSON.stringify(next.colors || DEFAULT_COLORS);
  if (prevColors !== nextColors) {
    return false; // Props changed, should re-render
  }
  
  // Compare data array - deep comparison
  const prevData = JSON.stringify(prev.data || []);
  const nextData = JSON.stringify(next.data || []);
  if (prevData !== nextData) {
    return false; // Props changed, should re-render
  }
  
  // All props are equal, skip re-render
  return true;
});

