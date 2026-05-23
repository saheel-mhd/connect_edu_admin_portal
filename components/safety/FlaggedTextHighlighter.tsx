/** Highlights commonly-flagged patterns in moderation review text. */
const PATTERNS: { name: string; regex: RegExp; tone: string }[] = [
  { name: 'phone', regex: /(?:\+?\d[\s().-]?){9,}\d/g, tone: 'bg-amber-100 text-amber-900' },
  {
    name: 'email',
    regex: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
    tone: 'bg-amber-100 text-amber-900',
  },
  {
    name: 'url',
    regex: /(https?:\/\/|www\.)[^\s]+/gi,
    tone: 'bg-sky-100 text-sky-900',
  },
  {
    name: 'grooming',
    regex:
      /\b(don'?t tell|our secret|send me a (?:photo|pic|picture)|how old are you|where do you live|are you alone|meet me)\b/gi,
    tone: 'bg-red-100 text-red-900 font-semibold',
  },
];

interface Segment {
  text: string;
  tone?: string;
}

export function FlaggedTextHighlighter({ text }: { text: string | null | undefined }) {
  if (!text) return <span className="text-slate-400">—</span>;
  const matches: { start: number; end: number; tone: string }[] = [];
  for (const pattern of PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text))) {
      matches.push({ start: m.index, end: m.index + m[0].length, tone: pattern.tone });
      if (m.index === regex.lastIndex) regex.lastIndex += 1;
    }
  }
  matches.sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.start < cursor) continue;
    if (match.start > cursor) segments.push({ text: text.slice(cursor, match.start) });
    segments.push({ text: text.slice(match.start, match.end), tone: match.tone });
    cursor = match.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  return (
    <span className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
      {segments.map((segment, index) =>
        segment.tone ? (
          <mark
            key={index}
            className={`${segment.tone} rounded px-1 py-0.5`}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
