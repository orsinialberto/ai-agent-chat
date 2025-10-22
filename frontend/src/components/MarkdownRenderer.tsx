import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Enhanced markdown parser with better formatting
  const parseMarkdown = (text: string): string => {
    let html = text;
    
    // Tables - Handle both markdown tables and ASCII tables
    html = html.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => cell.trim());
      return `<td class="px-3 py-2 border border-gray-300 text-sm">${cells.join('</td><td class="px-3 py-2 border border-gray-300 text-sm">')}</td>`;
    });
    
    // Wrap table rows
    html = html.replace(/(<td[^>]*>.*<\/td>)/gs, '<tr class="border-b border-gray-300">$1</tr>');
    
    // Wrap table
    html = html.replace(/(<tr[^>]*>.*<\/tr>)/gs, '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300">$1</table></div>');
    
    // Handle ASCII tables (like your example)
    html = html.replace(/^([^|\n]+)\n([-]+)\n((?:[^|\n]+\n)*)([-]+)$/gm, (match, header, separator1, rows, separator2) => {
      const headerCells = header.trim().split(/\s{2,}/).map(cell => cell.trim());
      const rowLines = rows.trim().split('\n');
      
      let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 bg-white">';
      
      // Header
      tableHtml += '<thead class="bg-gray-50">';
      tableHtml += '<tr>';
      headerCells.forEach(cell => {
        tableHtml += `<th class="px-4 py-2 border border-gray-300 text-left font-semibold text-gray-800">${cell}</th>`;
      });
      tableHtml += '</tr>';
      tableHtml += '</thead>';
      
      // Body
      tableHtml += '<tbody>';
      rowLines.forEach(row => {
        if (row.trim()) {
          const cells = row.trim().split(/\s{2,}/).map(cell => cell.trim());
          tableHtml += '<tr class="hover:bg-gray-50">';
          cells.forEach(cell => {
            tableHtml += `<td class="px-4 py-2 border border-gray-300 text-sm text-gray-700">${cell}</td>`;
          });
          tableHtml += '</tr>';
        }
      });
      tableHtml += '</tbody>';
      tableHtml += '</table></div>';
      
      return tableHtml;
    });
    
    // Headers (with better spacing)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mb-2 mt-4 text-gray-800">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-5 text-gray-800">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-6 text-gray-800">$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>');
    
    // Code blocks with language detection
    html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      return `<div class="my-3"><strong class="text-gray-800 font-semibold text-sm">Code blocks</strong><pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mt-2 border-l-4 border-blue-500"><code class="text-sm font-mono">${code.trim()}</code></pre></div>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border">$1</code>');
    
    // Lists (unordered)
    html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-gray-700">$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-gray-700">$1</li>');
    
    // Lists (ordered)
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal text-gray-700">$1</li>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-600 bg-gray-50 py-2 rounded-r">$1</blockquote>');
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr class="my-4 border-gray-300">');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    // Wrap lists in ul/ol tags
    html = html.replace(/(<li class="ml-4 list-disc text-gray-700">.*<\/li>)/gs, '<ul class="list-disc ml-4 my-2 space-y-1">$1</ul>');
    html = html.replace(/(<li class="ml-4 list-decimal text-gray-700">.*<\/li>)/gs, '<ol class="list-decimal ml-4 my-2 space-y-1">$1</ol>');
    
    return html;
  };

  const htmlContent = parseMarkdown(content);

  return (
    <div 
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      style={{
        lineHeight: '1.6',
        wordBreak: 'break-word'
      }}
    />
  );
};
