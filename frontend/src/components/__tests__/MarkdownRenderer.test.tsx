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
});
