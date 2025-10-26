import React from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';

// Test component for manual testing of complex markdown content
export const MarkdownTestComponent: React.FC = () => {
  const complexContent = `
# AI Agent Chat - Markdown Test

This is a comprehensive test of the new **MarkdownRenderer** component.

## Features Tested

### Code Blocks

Here's a JavaScript function:

\`\`\`javascript
function processMessage(message) {
  const processed = message
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\\s]/g, '');
  
  return {
    original: message,
    processed: processed,
    length: processed.length
  };
}
\`\`\`

And a Python example:

\`\`\`python
def analyze_text(text):
    """Analyze text and return statistics."""
    words = text.split()
    return {
        'word_count': len(words),
        'char_count': len(text),
        'avg_word_length': sum(len(word) for word in words) / len(words)
    }
\`\`\`

### Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Syntax Highlighting | ✅ Complete | High |
| Tables | ✅ Complete | High |
| Lists | ✅ Complete | Medium |
| Links | ✅ Complete | Medium |
| Task Lists | ✅ Complete | Low |

### Lists

#### Unordered List
- First item
- Second item
  - Nested item 1
  - Nested item 2
- Third item

#### Ordered List
1. First step
2. Second step
   1. Sub-step A
   2. Sub-step B
3. Final step

#### Task List
- [x] Install react-markdown
- [x] Implement new MarkdownRenderer
- [x] Update CSS styles
- [x] Write tests
- [ ] Manual testing
- [ ] Deploy to production

### Text Formatting

This paragraph contains **bold text**, *italic text*, and \`inline code\`.

You can also use ~~strikethrough~~ text.

### Links

Here are some useful links:
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)
- [Syntax Highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter)

### Blockquotes

> This is a blockquote with **bold text** and *italic text*.
> 
> It can span multiple lines and contain various formatting.

### Horizontal Rule

---

## Complex Example

Here's a complex example combining multiple features:

\`\`\`typescript
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
  };
}

const processChatMessage = (message: ChatMessage): ProcessedMessage => {
  // Process the message content
  const processedContent = message.content
    .replace(/\\n/g, '<br>')
    .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
  
  return {
    ...message,
    processedContent,
    wordCount: message.content.split(' ').length
  };
};
\`\`\`

### Performance Considerations

| Aspect | Old Renderer | New Renderer | Improvement |
|--------|-------------|--------------|-------------|
| Bundle Size | ~5KB | ~50KB | +45KB |
| Parsing Speed | Fast | Medium | -20% |
| Feature Support | Limited | Complete | +100% |
| Security | Manual | Automatic | +100% |
| Maintainability | Low | High | +200% |

## Conclusion

The new MarkdownRenderer provides:

1. **Better Security** - Automatic HTML sanitization
2. **Complete GFM Support** - Tables, task lists, strikethrough
3. **Syntax Highlighting** - Support for 100+ languages
4. **Better Maintainability** - Uses mature, well-tested libraries
5. **Future-Proof** - Easy to extend with new features

> **Note**: This test component should be removed before production deployment.
  `;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Markdown Rendering Test</h1>
      <div className="border-t pt-6">
        <MarkdownRenderer content={complexContent} />
      </div>
    </div>
  );
};
