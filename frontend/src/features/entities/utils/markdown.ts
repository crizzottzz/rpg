import { createElement, type ReactNode } from 'react';

/**
 * Convert a simple markdown string to React elements.
 * Handles headers, bold, italic, unordered lists, and tables.
 * No external dependency — covers the Open5e markdown subset.
 */
export function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  function flushList() {
    if (listItems.length === 0) return;
    elements.push(
      createElement(
        'ul',
        { key: `ul-${elements.length}`, className: 'list-disc list-inside space-y-1 my-2' },
        ...listItems.map((item, i) =>
          createElement('li', { key: i }, renderInline(item))
        )
      )
    );
    listItems = [];
  }

  function flushTable() {
    if (tableRows.length === 0) return;
    const [header, ...body] = tableRows;
    elements.push(
      createElement(
        'table',
        {
          key: `table-${elements.length}`,
          className: 'w-full text-sm border-collapse my-2',
        },
        createElement(
          'thead',
          null,
          createElement(
            'tr',
            { className: 'border-b border-gray-700' },
            ...header.map((cell, i) =>
              createElement(
                'th',
                {
                  key: i,
                  className: 'text-left py-1 px-2 text-gray-400 font-medium',
                },
                renderInline(cell)
              )
            )
          )
        ),
        createElement(
          'tbody',
          null,
          ...body.map((row, ri) =>
            createElement(
              'tr',
              { key: ri, className: 'border-b border-gray-800' },
              ...row.map((cell, ci) =>
                createElement(
                  'td',
                  { key: ci, className: 'py-1 px-2 text-gray-300' },
                  renderInline(cell)
                )
              )
            )
          )
        )
      )
    );
    tableRows = [];
    inTable = false;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    // Table separator row (skip)
    if (/^\|[\s:|-]+\|$/.test(trimmed)) {
      continue;
    }

    // Table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (!inTable) {
        flushList();
        inTable = true;
      }
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    }

    if (inTable) flushTable();

    // Headers
    const headerMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].length;
      const tag = `h${Math.min(level + 2, 6)}` as 'h3' | 'h4' | 'h5' | 'h6';
      const sizeClass =
        level === 1
          ? 'text-base font-semibold'
          : level === 2
            ? 'text-sm font-semibold'
            : 'text-sm font-medium';
      elements.push(
        createElement(
          tag,
          {
            key: `h-${elements.length}`,
            className: `${sizeClass} text-gray-200 mt-3 mb-1`,
          },
          renderInline(headerMatch[2])
        )
      );
      continue;
    }

    // Unordered list items
    if (/^[-*]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*]\s+/, '');
      listItems.push(content);
      continue;
    }

    flushList();

    // Empty line
    if (trimmed === '') {
      continue;
    }

    // Regular paragraph
    elements.push(
      createElement(
        'p',
        { key: `p-${elements.length}`, className: 'my-1' },
        renderInline(trimmed)
      )
    );
  }

  flushList();
  if (inTable) flushTable();
  return elements;
}

function renderInline(text: string): ReactNode {
  // Bold and italic patterns
  const parts: ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  const pattern = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(
        createElement(
          'strong',
          { key: keyIdx++, className: 'font-bold italic' },
          match[1]
        )
      );
    } else if (match[2]) {
      parts.push(
        createElement('strong', { key: keyIdx++, className: 'font-bold' }, match[2])
      );
    } else if (match[3]) {
      parts.push(
        createElement('em', { key: keyIdx++, className: 'italic' }, match[3])
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : parts;
}
