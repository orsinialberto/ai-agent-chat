import React from 'react';
import { render, screen } from '@testing-library/react';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders basic markdown correctly', () => {
    const content = '# Hello World\n\nThis is **bold** text.';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hello World');
    expect(screen.getByText('This is')).toBeInTheDocument();
    expect(screen.getByText('bold')).toHaveClass('font-semibold');
  });

  it('renders multiple heading levels', () => {
    const content = '# H1\n## H2\n### H3';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('H2');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('H3');
  });

  it('renders code blocks with syntax highlighting', () => {
    const content = '```javascript\nconst hello = "world";\n```';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText('const hello = "world";')).toBeInTheDocument();
  });

  it('renders inline code correctly', () => {
    const content = 'This is `inline code` in text.';
    render(<MarkdownRenderer content={content} />);
    
    const codeElement = screen.getByText('inline code');
    expect(codeElement).toHaveClass('inline-code');
  });

  it('renders tables correctly', () => {
    const content = '| Name | Age |\n|------|-----|\n| John | 25 |\n| Jane | 30 |';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders lists correctly', () => {
    const content = '- Item 1\n- Item 2\n- Item 3';
    render(<MarkdownRenderer content={content} />);
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders ordered lists correctly', () => {
    const content = '1. First item\n2. Second item\n3. Third item';
    render(<MarkdownRenderer content={content} />);
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(screen.getByText('First item')).toBeInTheDocument();
    expect(screen.getByText('Second item')).toBeInTheDocument();
    expect(screen.getByText('Third item')).toBeInTheDocument();
  });

  it('renders links correctly', () => {
    const content = '[Google](https://google.com)';
    render(<MarkdownRenderer content={content} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveTextContent('Google');
  });

  it('renders blockquotes correctly', () => {
    const content = '> This is a blockquote';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText('This is a blockquote')).toBeInTheDocument();
  });

  it('renders horizontal rules correctly', () => {
    const content = 'Content above\n\n---\n\nContent below';
    render(<MarkdownRenderer content={content} />);
    
    expect(screen.getByText('Content above')).toBeInTheDocument();
    expect(screen.getByText('Content below')).toBeInTheDocument();
  });

  it('renders strikethrough text correctly', () => {
    const content = 'This is ~~strikethrough~~ text.';
    render(<MarkdownRenderer content={content} />);
    
    const strikethrough = screen.getByText('strikethrough');
    expect(strikethrough).toHaveClass('line-through');
  });

  it('renders task lists correctly', () => {
    const content = '- [x] Completed task\n- [ ] Incomplete task';
    render(<MarkdownRenderer content={content} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('applies custom className', () => {
    const content = 'Test content';
    const { container } = render(<MarkdownRenderer content={content} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('markdown-content', 'custom-class');
  });

  it('handles empty content gracefully', () => {
    render(<MarkdownRenderer content="" />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
  });

  it('handles complex nested content', () => {
    const content = `
# Complex Content

This is a **bold** paragraph with \`inline code\` and a [link](https://example.com).

## Code Example

\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

## Table

| Name | Age | City |
|------|-----|------|
| John | 25  | NYC  |
| Jane | 30  | LA   |

## List

- Item 1
- Item 2
  - Nested item
  - Another nested item

> This is a blockquote with **bold** text.
    `;
    
    render(<MarkdownRenderer content={content} />);
    
    // Check various elements are rendered
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Complex Content');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Code Example');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('function hello()')).toBeInTheDocument();
    expect(screen.getByText('This is a')).toBeInTheDocument();
    expect(screen.getByText('bold')).toHaveClass('font-semibold');
  });
});
