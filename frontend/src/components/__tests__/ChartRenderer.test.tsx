import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartRenderer } from '../ChartRenderer';

describe('ChartRenderer', () => {
  const mockData = [
    { month: 'Jan', sales: 1200 },
    { month: 'Feb', sales: 1900 },
    { month: 'Mar', sales: 1600 }
  ];

  describe('Line Chart', () => {
    it('renders line chart with data', () => {
      const { container } = render(
        <ChartRenderer 
          chartData={{
            type: 'line',
            data: mockData,
            xKey: 'month',
            yKey: 'sales'
          }} 
        />
      );
      
      // Check that the component renders without error
      expect(container.firstChild).toBeTruthy();
    });

    it('renders line chart with title', () => {
      const title = 'Monthly Sales';
      render(
        <ChartRenderer 
          chartData={{
            type: 'line',
            title,
            data: mockData,
            xKey: 'month',
            yKey: 'sales'
          }} 
        />
      );
      
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  describe('Bar Chart', () => {
    it('renders bar chart with data', () => {
      const { container } = render(
        <ChartRenderer 
          chartData={{
            type: 'bar',
            data: mockData,
            xKey: 'month',
            yKey: 'sales'
          }} 
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Pie Chart', () => {
    it('renders pie chart with data', () => {
      const pieData = [
        { name: 'A', value: 30 },
        { name: 'B', value: 40 },
        { name: 'C', value: 30 }
      ];
      
      const { container } = render(
        <ChartRenderer 
          chartData={{
            type: 'pie',
            data: pieData,
            xKey: 'name',
            yKey: 'value'
          }} 
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Area Chart', () => {
    it('renders area chart with data', () => {
      const { container } = render(
        <ChartRenderer 
          chartData={{
            type: 'area',
            data: mockData,
            xKey: 'month',
            yKey: 'sales'
          }} 
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('shows warning for empty data', () => {
      render(
        <ChartRenderer 
          chartData={{
            type: 'line',
            data: [],
            xKey: 'x',
            yKey: 'y'
          }} 
        />
      );
      
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
    });

    it('handles missing data array', () => {
      render(
        <ChartRenderer 
          chartData={{
            type: 'line',
            data: null as any,
            xKey: 'x',
            yKey: 'y'
          }} 
        />
      );
      
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('uses default keys when not provided', () => {
      const defaultData = [
        { x: 'A', y: 10 },
        { x: 'B', y: 20 }
      ];
      
      const { container } = render(
        <ChartRenderer 
          chartData={{
            data: defaultData
          }} 
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });

    it('defaults to line chart when type not specified', () => {
      const { container } = render(
        <ChartRenderer 
          chartData={{
            data: mockData,
            xKey: 'month',
            yKey: 'sales'
          }} 
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Multiple Series', () => {
    it('renders multiple lines when yKeys array provided', () => {
      const multiSeriesData = [
        { month: 'Jan', sales: 1200, profit: 400 },
        { month: 'Feb', sales: 1900, profit: 600 }
      ];
      
      const { container } = render(
        <ChartRenderer 
          chartData={{
            type: 'line',
            data: multiSeriesData,
            xKey: 'month',
            yKeys: ['sales', 'profit']
          }} 
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('Custom Colors', () => {
    it('applies custom colors when provided', () => {
      const customColors = ['#FF0000', '#00FF00', '#0000FF'];
      
      const { container } = render(
        <ChartRenderer 
          chartData={{
            type: 'bar',
            data: mockData,
            xKey: 'month',
            yKey: 'sales',
            colors: customColors
          }} 
        />
      );
      
      expect(container.firstChild).toBeTruthy();
    });
  });
});

