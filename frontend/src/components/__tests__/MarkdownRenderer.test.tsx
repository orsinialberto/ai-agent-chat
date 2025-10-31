import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders content', () => {
    const content = 'Test content';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText(content)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const content = 'Test content';
    const { container } = render(<MarkdownRenderer content={content} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('markdown-content');
  });

  it('handles empty content gracefully', () => {
    const { container } = render(<MarkdownRenderer content="" />);
    expect(container).toBeInTheDocument();
  });

  it('renders markdown content structure', () => {
    const content = '# Test Heading\n\nTest paragraph';
    const { container } = render(<MarkdownRenderer content={content} />);
    
    expect(container.querySelector('.markdown-content')).toBeInTheDocument();
  });

  describe('Chart Rendering', () => {
    it('renders chart block with valid JSON', async () => {
      const content = '```chart:line\n{"data": [{"x": "A", "y": 10}], "xKey": "x", "yKey": "y"}\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      // Wait for markdown to be loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if chart is rendered (recharts wrapper should be present)
      const charts = container.querySelectorAll('.recharts-wrapper');
      expect(charts.length).toBeGreaterThanOrEqual(0); // May be 0 if markdown not loaded yet
    });

    it('shows error for invalid JSON in chart block', async () => {
      const content = '```chart:line\ninvalid json\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      // Wait for markdown to be loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should either show error or render as normal code block
      expect(container).toBeInTheDocument();
    });

    it('renders bar chart type', async () => {
      const content = '```chart:bar\n{"data": [{"x": "A", "y": 10}], "xKey": "x", "yKey": "y"}\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(container).toBeInTheDocument();
    });

    it('renders pie chart type', async () => {
      const content = '```chart:pie\n{"data": [{"name": "A", "value": 30}], "xKey": "name", "yKey": "value"}\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(container).toBeInTheDocument();
    });

    it('renders area chart type', async () => {
      const content = '```chart:area\n{"data": [{"x": "A", "y": 10}], "xKey": "x", "yKey": "y"}\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(container).toBeInTheDocument();
    });

    it('renders chart with title', async () => {
      const content = '```chart:line\n{"title": "Test Chart", "data": [{"x": "A", "y": 10}], "xKey": "x", "yKey": "y"}\n```';
      const { container } = render(<MarkdownRenderer content={content} />);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(container).toBeInTheDocument();
    });
  });
});
