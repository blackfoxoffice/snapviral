import { Fragment } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] }
  | { kind: 'code'; lang: string | null; body: string }
  | { kind: 'quote'; text: string }
  | { kind: 'hr' }
  | { kind: 'img'; src: string; alt: string };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || null;
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        body.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ kind: 'code', lang, body: body.join('\n') });
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      blocks.push({ kind: 'h1', text: line.slice(2).trim() });
      i++;
      continue;
    }

    // Image
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)\s*$/);
    if (imgMatch) {
      blocks.push({ kind: 'img', alt: imgMatch[1], src: imgMatch[2] });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(---|\*\*\*|___)\s*$/.test(line)) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const buf: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ kind: 'quote', text: buf.join(' ') });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', items });
      continue;
    }

    // Paragraph (collect contiguous non-empty lines)
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: 'p', text: buf.join(' ') });
  }
  return blocks;
}

function isBlockStart(line: string): boolean {
  return (
    line.startsWith('#') ||
    line.startsWith('```') ||
    line.startsWith('> ') ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^(---|\*\*\*|___)\s*$/.test(line)
  );
}

type Span =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: Span[] }
  | { kind: 'italic'; value: Span[] }
  | { kind: 'code'; value: string }
  | { kind: 'link'; href: string; value: Span[] };

function parseInline(src: string): Span[] {
  const out: Span[] = [];
  let i = 0;
  let buf = '';
  const flush = () => {
    if (buf) {
      out.push({ kind: 'text', value: buf });
      buf = '';
    }
  };
  while (i < src.length) {
    const c = src[i];
    // Inline code
    if (c === '`') {
      const end = src.indexOf('`', i + 1);
      if (end !== -1) {
        flush();
        out.push({ kind: 'code', value: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Bold **
    if (c === '*' && src[i + 1] === '*') {
      const end = src.indexOf('**', i + 2);
      if (end !== -1) {
        flush();
        out.push({ kind: 'bold', value: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }
    // Italic *
    if (c === '*') {
      const end = src.indexOf('*', i + 1);
      if (end !== -1) {
        flush();
        out.push({ kind: 'italic', value: parseInline(src.slice(i + 1, end)) });
        i = end + 1;
        continue;
      }
    }
    // Link [text](url)
    if (c === '[') {
      const closeBracket = src.indexOf(']', i);
      if (closeBracket !== -1 && src[closeBracket + 1] === '(') {
        const closeParen = src.indexOf(')', closeBracket + 2);
        if (closeParen !== -1) {
          flush();
          const text = src.slice(i + 1, closeBracket);
          const href = src.slice(closeBracket + 2, closeParen);
          out.push({ kind: 'link', href, value: parseInline(text) });
          i = closeParen + 1;
          continue;
        }
      }
    }
    buf += c;
    i++;
  }
  flush();
  return out;
}

function renderSpans(spans: Span[], baseColor = '#1F2937'): React.ReactNode {
  return spans.map((s, idx) => {
    if (s.kind === 'text') return <Fragment key={idx}>{s.value}</Fragment>;
    if (s.kind === 'bold')
      return (
        <Text key={idx} style={{ fontWeight: '700', color: baseColor }}>
          {renderSpans(s.value, baseColor)}
        </Text>
      );
    if (s.kind === 'italic')
      return (
        <Text key={idx} style={{ fontStyle: 'italic', color: baseColor }}>
          {renderSpans(s.value, baseColor)}
        </Text>
      );
    if (s.kind === 'code')
      return (
        <Text
          key={idx}
          style={{
            fontFamily: 'monospace',
            backgroundColor: '#F1F5F9',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            fontSize: 14,
            color: '#E11D48',
          }}
        >
          {s.value}
        </Text>
      );
    if (s.kind === 'link')
      return (
        <Text
          key={idx}
          onPress={() => {
            try {
              Linking.openURL(s.href);
            } catch {
              /* noop */
            }
          }}
          style={{ color: '#E53935', textDecorationLine: 'underline', fontWeight: '500' }}
        >
          {renderSpans(s.value, '#E53935')}
        </Text>
      );
    return null;
  });
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <View style={{ gap: 0 }}>
      {blocks.map((b, idx) => {
        if (b.kind === 'h1')
          return (
            <Text
              key={idx}
              style={{
                fontSize: 36,
                lineHeight: 44,
                fontWeight: '800',
                color: '#0F172A',
                letterSpacing: -1.2,
                marginTop: idx === 0 ? 0 : 36,
                marginBottom: 16,
              }}
            >
              {renderSpans(parseInline(b.text), '#0F172A')}
            </Text>
          );
        if (b.kind === 'h2')
          return (
            <Text
              key={idx}
              style={{
                fontSize: 28,
                lineHeight: 36,
                fontWeight: '800',
                color: '#0F172A',
                letterSpacing: -0.8,
                marginTop: idx === 0 ? 0 : 32,
                marginBottom: 14,
              }}
            >
              {renderSpans(parseInline(b.text), '#0F172A')}
            </Text>
          );
        if (b.kind === 'h3')
          return (
            <Text
              key={idx}
              style={{
                fontSize: 22,
                lineHeight: 30,
                fontWeight: '700',
                color: '#0F172A',
                letterSpacing: -0.5,
                marginTop: idx === 0 ? 0 : 24,
                marginBottom: 12,
              }}
            >
              {renderSpans(parseInline(b.text), '#0F172A')}
            </Text>
          );
        if (b.kind === 'p')
          return (
            <Text
              key={idx}
              style={{
                fontSize: 17,
                lineHeight: 30,
                color: '#1F2937',
                marginBottom: 18,
              }}
            >
              {renderSpans(parseInline(b.text), '#1F2937')}
            </Text>
          );
        if (b.kind === 'ul')
          return (
            <View key={idx} style={{ marginBottom: 18, gap: 8 }}>
              {b.items.map((it, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                  <Text style={{ fontSize: 17, color: '#E53935', lineHeight: 30, fontWeight: '700' }}>•</Text>
                  <Text style={{ flex: 1, fontSize: 17, lineHeight: 30, color: '#1F2937' }}>
                    {renderSpans(parseInline(it), '#1F2937')}
                  </Text>
                </View>
              ))}
            </View>
          );
        if (b.kind === 'ol')
          return (
            <View key={idx} style={{ marginBottom: 18, gap: 8 }}>
              {b.items.map((it, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 10 }}>
                  <Text style={{ fontSize: 17, color: '#E53935', lineHeight: 30, fontWeight: '700', minWidth: 22 }}>
                    {j + 1}.
                  </Text>
                  <Text style={{ flex: 1, fontSize: 17, lineHeight: 30, color: '#1F2937' }}>
                    {renderSpans(parseInline(it), '#1F2937')}
                  </Text>
                </View>
              ))}
            </View>
          );
        if (b.kind === 'code')
          return (
            <View
              key={idx}
              style={{
                backgroundColor: '#0F172A',
                borderRadius: 12,
                padding: 18,
                marginBottom: 22,
                marginTop: 4,
                overflow: 'hidden',
              }}
            >
              {b.lang ? (
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
                  {b.lang}
                </Text>
              ) : null}
              <Text style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 22, color: '#E2E8F0' }}>
                {b.body}
              </Text>
            </View>
          );
        if (b.kind === 'quote')
          return (
            <View
              key={idx}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: '#E53935',
                paddingLeft: 18,
                paddingVertical: 4,
                marginBottom: 22,
                marginTop: 4,
              }}
            >
              <Text style={{ fontSize: 18, lineHeight: 30, color: '#475569', fontStyle: 'italic' }}>
                {renderSpans(parseInline(b.text), '#475569')}
              </Text>
            </View>
          );
        if (b.kind === 'hr')
          return (
            <View
              key={idx}
              style={{
                height: 1,
                backgroundColor: 'rgba(15,23,42,0.08)',
                marginVertical: 28,
              }}
            />
          );
        if (b.kind === 'img')
          return (
            <View
              key={idx}
              style={{
                aspectRatio: 16 / 9,
                borderRadius: 14,
                backgroundColor: '#F1F5F9',
                backgroundImage: `url(${b.src})` as any,
                backgroundSize: 'cover' as any,
                backgroundPosition: 'center' as any,
                marginVertical: 18,
                overflow: 'hidden',
              }}
            />
          );
        return null;
      })}
    </View>
  );
}
