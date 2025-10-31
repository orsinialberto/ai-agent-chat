# Chart Visualization

## Overview

The AI Agent Chat application supports interactive chart visualization directly within chat messages. The LLM can generate data visualizations using special markdown code blocks, which are automatically rendered as interactive charts using Recharts.

## Supported Chart Types

### 1. Line Chart (`chart:line`)
Best for showing trends over time or continuous data.

```markdown
\`\`\`chart:line
{
  "title": "Monthly Sales 2024",
  "data": [
    {"month": "Jan", "sales": 1200},
    {"month": "Feb", "sales": 1900},
    {"month": "Mar", "sales": 1600}
  ],
  "xKey": "month",
  "yKey": "sales"
}
\`\`\`
```

### 2. Bar Chart (`chart:bar`)
Best for comparing values across categories.

```markdown
\`\`\`chart:bar
{
  "title": "Product Categories Revenue",
  "data": [
    {"category": "Electronics", "revenue": 45000},
    {"category": "Clothing", "revenue": 32000},
    {"category": "Food", "revenue": 28000}
  ],
  "xKey": "category",
  "yKey": "revenue"
}
\`\`\`
```

### 3. Pie Chart (`chart:pie`)
Best for showing proportions and percentages.

```markdown
\`\`\`chart:pie
{
  "title": "Market Share Distribution",
  "data": [
    {"name": "Company A", "value": 35},
    {"name": "Company B", "value": 28},
    {"name": "Company C", "value": 22},
    {"name": "Others", "value": 15}
  ],
  "xKey": "name",
  "yKey": "value"
}
\`\`\`
```

### 4. Area Chart (`chart:area`)
Best for showing cumulative data or filled trends.

```markdown
\`\`\`chart:area
{
  "title": "Cumulative Growth",
  "data": [
    {"month": "Jan", "value": 1200},
    {"month": "Feb", "value": 3100},
    {"month": "Mar", "value": 4700}
  ],
  "xKey": "month",
  "yKey": "value"
}
\`\`\`
```

## Advanced Features

### Multiple Series
You can display multiple data series on the same chart using the `yKeys` array:

```markdown
\`\`\`chart:line
{
  "title": "Sales vs Profit",
  "data": [
    {"month": "Jan", "sales": 1200, "profit": 400},
    {"month": "Feb", "sales": 1900, "profit": 600},
    {"month": "Mar", "sales": 1600, "profit": 500}
  ],
  "xKey": "month",
  "yKeys": ["sales", "profit"]
}
\`\`\`
```

### Custom Colors
Specify custom colors for your charts:

```markdown
\`\`\`chart:bar
{
  "title": "Custom Colored Chart",
  "data": [
    {"category": "A", "value": 100},
    {"category": "B", "value": 150}
  ],
  "xKey": "category",
  "yKey": "value",
  "colors": ["#FF6384", "#36A2EB"]
}
\`\`\`
```

## Data Format Specification

### Required Fields
- `data`: Array of objects containing the chart data
- `xKey`: The property name to use for x-axis labels (default: "x")
- `yKey`: The property name to use for y-axis values (default: "y")

### Optional Fields
- `title`: Chart title displayed above the visualization
- `type`: Chart type (automatically set by the code block language)
- `yKeys`: Array of property names for multiple series (replaces `yKey`)
- `colors`: Array of hex color codes for customizing chart colors

### Data Structure Example
```json
{
  "title": "Optional Title",
  "data": [
    {"label": "Item 1", "value": 100},
    {"label": "Item 2", "value": 200}
  ],
  "xKey": "label",
  "yKey": "value",
  "colors": ["#0088FE", "#00C49F"]
}
```

## Technical Implementation

### Frontend Components

#### ChartRenderer Component
Location: `frontend/src/components/ChartRenderer.tsx`

Handles the rendering of charts using Recharts library. Supports:
- Automatic chart type selection
- Responsive sizing
- Error handling for invalid data
- Default values for missing configuration

#### MarkdownRenderer Integration
Location: `frontend/src/components/MarkdownRenderer.tsx`

The MarkdownRenderer component intercepts code blocks with the `chart:` language prefix and passes them to the ChartRenderer:

```typescript
// Pattern matching: language-chart:TYPE
const match = /language-chart:(\w+)/.exec(className || '');
if (match) {
  const chartType = match[1];
  const chartData = JSON.parse(String(children));
  return <ChartRenderer chartData={{ ...chartData, type: chartType }} />;
}
```

### Backend Integration

#### LLM System Instruction
Location: `backend/src/services/geminiService.ts`

The LLM is instructed on chart syntax through a comprehensive system instruction that includes:
- Syntax examples for all chart types
- Data format specifications
- Best practices for choosing chart types
- Usage guidelines

### Dependencies

**Frontend:**
- `recharts`: ^2.x - Chart visualization library
- `react-markdown`: For markdown parsing
- `remark-gfm`: GitHub Flavored Markdown support

## Error Handling

### Invalid JSON
If the chart data contains invalid JSON, an error message is displayed:
```
❌ Error rendering chart
Invalid JSON data. Please check the chart syntax.
```

### Empty Data
If no data is provided, a warning is shown:
```
⚠️ No data available for chart
```

### Missing Configuration
The ChartRenderer provides sensible defaults:
- Default `xKey`: "x"
- Default `yKey`: "y"
- Default chart type: "line"
- Default colors: Blue-green palette

## Testing

### Unit Tests
Location: `frontend/src/components/__tests__/ChartRenderer.test.tsx`

Tests cover:
- All chart types rendering
- Title display
- Error handling (empty data, missing data)
- Default values
- Multiple series support
- Custom colors

### Integration Tests
Location: `frontend/src/components/__tests__/MarkdownRenderer.test.tsx`

Tests verify:
- Chart block parsing
- JSON error handling
- Different chart type rendering

### Test Setup
ResizeObserver mock is added in `frontend/src/test/setup.ts` to support Recharts in JSDOM environment.

## Usage Examples

### Ask the LLM
Simply ask the AI to create charts naturally:

- "Show me a bar chart of our top 5 products by revenue"
- "Create a line chart showing temperature trends for the last 7 days"
- "Generate a pie chart of market share distribution"

The LLM will automatically format the data in the correct chart syntax.

### Manual Chart Creation
You can also manually create charts in your messages using the syntax documented above.

## Best Practices

### For Users
1. Be specific about chart type when asking the LLM
2. Provide clear data requirements
3. Request titles for better context

### For LLM Prompting
1. Always include a descriptive title
2. Keep data arrays concise (5-10 data points ideal)
3. Use meaningful property names for xKey and yKey
4. Choose appropriate chart types:
   - Trends over time → Line/Area chart
   - Comparisons → Bar chart
   - Proportions → Pie chart

### For Developers
1. Validate data structure before rendering
2. Provide fallback for missing configuration
3. Handle JSON parsing errors gracefully
4. Test with various data sizes

## Limitations

1. **Data Size**: Charts work best with 3-50 data points
2. **Performance**: Very large datasets may impact rendering performance
3. **Mobile**: Complex charts may be harder to read on small screens
4. **Browser Support**: Requires modern browser with SVG support

## Future Enhancements

Potential improvements for future versions:
- [ ] Additional chart types (scatter, radar, candlestick)
- [ ] Interactive data tooltips customization
- [ ] Chart export functionality (PNG, SVG)
- [ ] Real-time data updates
- [ ] Chart theming support
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Chart animations and transitions

## Troubleshooting

### Chart not rendering
1. Check JSON syntax is valid
2. Verify `data` array is not empty
3. Ensure `xKey` and `yKey` match data properties

### Invalid colors
- Colors must be valid hex codes (e.g., "#FF0000")
- Provide colors array matching number of series

### Pie chart labels overlapping
- Reduce number of data points
- Consider using a legend instead of labels

## Related Documentation

- [Markdown Support](./markdown-support.md) - General markdown rendering
- [Frontend Components](../architecture/) - Component architecture
- [LLM Integration](../integrations/gemini-api.md) - LLM configuration

