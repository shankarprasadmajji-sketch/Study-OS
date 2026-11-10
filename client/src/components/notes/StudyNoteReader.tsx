import React, { useState, useId } from 'react';
import {
  Edit3,
  Copy,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
  Code2,
  Quote,
} from 'lucide-react';

export type ReaderTheme = 'cosmic' | 'emerald' | 'sunset' | 'sakura';
export type ReaderFontSize = 'sm' | 'md' | 'lg';

interface StudyNoteReaderProps {
  title: string;
  content: string;
  subjectName?: string | null;
  topicTitle?: string | null;
  tags?: string[];
  updatedAt?: string;
  onEditClick: () => void;
  onUpdateContent?: (newContent: string) => void;
}

export const StudyNoteReader: React.FC<StudyNoteReaderProps> = ({
  title,
  content,
  subjectName,
  topicTitle,
  tags = [],
  updatedAt,
  onEditClick,
  onUpdateContent,
}) => {
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem('studyos_reader_theme') as ReaderTheme) || 'cosmic';
  });

  const [fontSize, setFontSize] = useState<ReaderFontSize>(() => {
    return (localStorage.getItem('studyos_reader_font_size') as ReaderFontSize) || 'md';
  });

  const [copied, setCopied] = useState(false);

  const handleThemeChange = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    localStorage.setItem('studyos_reader_theme', newTheme);
  };

  const handleFontSizeChange = (size: ReaderFontSize) => {
    setFontSize(size);
    localStorage.setItem('studyos_reader_font_size', size);
  };

  const handleCopy = () => {
    const fullText = `${title}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle interactive checklist line
  const handleToggleChecklist = (lineIndex: number) => {
    if (!onUpdateContent) return;
    const lines = content.split('\n');
    const targetLine = lines[lineIndex];
    if (!targetLine) return;

    if (targetLine.includes('- [ ]')) {
      lines[lineIndex] = targetLine.replace('- [ ]', '- [x]');
    } else if (targetLine.includes('- [x]')) {
      lines[lineIndex] = targetLine.replace('- [x]', '- [ ]');
    }
    onUpdateContent(lines.join('\n'));
  };

  // Theme style mappings
  const themeStyles = {
    cosmic: {
      card: 'bg-card border-indigo-200 dark:border-indigo-500/30 text-foreground dark:text-slate-100',
      titleGrad: 'bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 dark:from-cyan-400 dark:via-indigo-300 dark:to-fuchsia-400 bg-clip-text text-transparent',
      h1: 'text-indigo-900 dark:text-cyan-300 border-b border-indigo-200 dark:border-cyan-500/30',
      h2: 'text-indigo-800 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-500/20',
      h3: 'text-amber-800 dark:text-amber-300',
      bold: 'text-amber-900 bg-amber-100/70 border border-amber-300 dark:text-amber-300 dark:bg-amber-400/15 dark:border-amber-400/30 px-1.5 py-0.5 rounded font-bold',
      italic: 'text-purple-700 dark:text-fuchsia-300 italic',
      bullet: 'bg-primary-600 dark:bg-cyan-400 shadow-sm',
      callout: 'bg-indigo-50 dark:bg-indigo-950/60 border-l-4 border-indigo-500 text-indigo-950 dark:text-indigo-100',
      code: 'bg-muted border border-border text-primary-700 dark:bg-slate-900 dark:border-indigo-500/30 dark:text-cyan-300',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-700/60',
      meta: 'text-muted-foreground dark:text-indigo-200/80',
    },
    emerald: {
      card: 'bg-card border-emerald-200 dark:border-emerald-500/30 text-foreground dark:text-emerald-50',
      titleGrad: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-300 bg-clip-text text-transparent',
      h1: 'text-emerald-900 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-500/30',
      h2: 'text-teal-900 dark:text-teal-300 border-b border-teal-100 dark:border-teal-500/20',
      h3: 'text-lime-800 dark:text-lime-300',
      bold: 'text-emerald-900 bg-emerald-100/70 border border-emerald-300 dark:text-lime-300 dark:bg-lime-400/15 dark:border-lime-400/30 px-1.5 py-0.5 rounded font-bold',
      italic: 'text-teal-700 dark:text-teal-300 italic',
      bullet: 'bg-emerald-600 dark:bg-emerald-400 shadow-sm',
      callout: 'bg-emerald-50 dark:bg-emerald-950/60 border-l-4 border-emerald-500 text-emerald-950 dark:text-emerald-100',
      code: 'bg-muted border border-border text-emerald-700 dark:bg-stone-900 dark:border-emerald-500/30 dark:text-emerald-300',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700/60',
      meta: 'text-muted-foreground dark:text-emerald-200/80',
    },
    sunset: {
      card: 'bg-card border-amber-200 dark:border-amber-500/30 text-foreground dark:text-amber-50',
      titleGrad: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 dark:from-amber-400 dark:via-orange-300 dark:to-rose-400 bg-clip-text text-transparent',
      h1: 'text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-500/30',
      h2: 'text-orange-900 dark:text-orange-300 border-b border-orange-100 dark:border-orange-500/20',
      h3: 'text-amber-800 dark:text-yellow-300',
      bold: 'text-amber-950 bg-amber-100/70 border border-amber-300 dark:text-yellow-300 dark:bg-yellow-400/15 dark:border-yellow-400/30 px-1.5 py-0.5 rounded font-bold',
      italic: 'text-orange-700 dark:text-orange-300 italic',
      bullet: 'bg-amber-600 dark:bg-amber-400 shadow-sm',
      callout: 'bg-amber-50 dark:bg-amber-950/60 border-l-4 border-amber-500 text-amber-950 dark:text-amber-100',
      code: 'bg-muted border border-border text-amber-700 dark:bg-stone-900 dark:border-amber-500/30 dark:text-amber-300',
      badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700/60',
      meta: 'text-muted-foreground dark:text-amber-200/80',
    },
    sakura: {
      card: 'bg-card border-pink-200 dark:border-pink-500/30 text-foreground dark:text-pink-50',
      titleGrad: 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 dark:from-pink-400 dark:via-fuchsia-300 dark:to-purple-400 bg-clip-text text-transparent',
      h1: 'text-pink-900 dark:text-pink-300 border-b border-pink-200 dark:border-pink-500/30',
      h2: 'text-fuchsia-900 dark:text-fuchsia-300 border-b border-fuchsia-100 dark:border-fuchsia-500/20',
      h3: 'text-purple-800 dark:text-purple-300',
      bold: 'text-pink-950 bg-pink-100/70 border border-pink-300 dark:text-pink-300 dark:bg-pink-400/15 dark:border-pink-400/30 px-1.5 py-0.5 rounded font-bold',
      italic: 'text-purple-700 dark:text-purple-300 italic',
      bullet: 'bg-pink-600 dark:bg-pink-400 shadow-sm',
      callout: 'bg-pink-50 dark:bg-purple-950/60 border-l-4 border-pink-400 text-pink-950 dark:text-pink-100',
      code: 'bg-muted border border-border text-pink-700 dark:bg-neutral-900 dark:border-pink-500/30 dark:text-pink-300',
      badge: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/60 dark:text-pink-300 dark:border-pink-700/60',
      meta: 'text-muted-foreground dark:text-pink-200/80',
    },
  }[theme];

  const fontSizes = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
  }[fontSize];

  // Render inline rich elements (bold, italic, code pills, marks)
  const renderInline = (raw: string, keyPrefix: string) => {
    // Regex splits on markdown tokens: `code`, **bold**, *italic*, ==highlight==
    const parts = raw.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==)/g);

    return parts.map((part, idx) => {
      const partKey = `${keyPrefix}-${idx}`;
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={partKey}
            className={`px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono border ${themeStyles.code}`}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <span key={partKey} className={themeStyles.bold}>
            {part.slice(2, -2)}
          </span>
        );
      }
      if (part.startsWith('==') && part.endsWith('==') && part.length >= 4) {
        return (
          <mark
            key={partKey}
            className="bg-yellow-300/30 text-yellow-100 dark:text-yellow-200 px-1.5 py-0.5 rounded font-bold"
          >
            {part.slice(2, -2)}
          </mark>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={partKey} className={themeStyles.italic}>
            {part.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={partKey}>{part}</React.Fragment>;
    });
  };

  // Render content line-by-line with study formatting
  const renderContentLines = () => {
    if (!content.trim()) {
      return (
        <div className="py-12 text-center text-muted-foreground/60 italic">
          This study note is empty. Click "Edit Note" above to write study points, derivations, or summaries.
        </div>
      );
    }

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    lines.forEach((line, index) => {
      const lineKey = `line-${index}`;

      // Code blocks ```
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div
              key={lineKey}
              className={`my-3 p-3.5 rounded-xl border font-mono text-xs overflow-x-auto ${themeStyles.code}`}
            >
              <pre>{codeBuffer.join('\n')}</pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      const trimmed = line.trim();

      // Empty lines
      if (!trimmed) {
        elements.push(<div key={lineKey} className="h-3" />);
        return;
      }

      // Heading 1
      if (line.startsWith('# ')) {
        elements.push(
          <h2
            key={lineKey}
            className={`text-xl sm:text-2xl font-black mt-6 mb-3 pb-1 tracking-tight ${themeStyles.h1}`}
          >
            {renderInline(line.replace('# ', ''), lineKey)}
          </h2>
        );
        return;
      }

      // Heading 2
      if (line.startsWith('## ')) {
        elements.push(
          <h3
            key={lineKey}
            className={`text-lg sm:text-xl font-bold mt-5 mb-2 pb-1 tracking-tight ${themeStyles.h2}`}
          >
            {renderInline(line.replace('## ', ''), lineKey)}
          </h3>
        );
        return;
      }

      // Heading 3
      if (line.startsWith('### ')) {
        elements.push(
          <h4
            key={lineKey}
            className={`text-base sm:text-lg font-semibold mt-4 mb-1.5 ${themeStyles.h3}`}
          >
            {renderInline(line.replace('### ', ''), lineKey)}
          </h4>
        );
        return;
      }

      // Checklist item: - [ ] or - [x]
      if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        const isChecked = line.trim().startsWith('- [x]');
        const textPart = line.replace(/^\s*-\s*\[( |x)\]\s*/, '');
        elements.push(
          <div
            key={lineKey}
            onClick={() => handleToggleChecklist(index)}
            className="flex items-start gap-2.5 my-1.5 py-1 px-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group select-none"
          >
            <div className="mt-0.5 shrink-0 text-primary-400">
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
              )}
            </div>
            <span
              className={`${
                isChecked
                  ? 'line-through opacity-50'
                  : 'font-medium'
              } flex-1`}
            >
              {renderInline(textPart, lineKey)}
            </span>
          </div>
        );
        return;
      }

      // Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const textPart = line.replace(/^\s*[-*]\s*/, '');
        elements.push(
          <div key={lineKey} className="flex items-start gap-3 my-1.5 pl-1.5">
            <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${themeStyles.bullet}`} />
            <div className="flex-1 font-medium">{renderInline(textPart, lineKey)}</div>
          </div>
        );
        return;
      }

      // Blockquote / Formula Callout
      if (line.trim().startsWith('> ')) {
        const textPart = line.replace(/^\s*>\s*/, '');
        elements.push(
          <div
            key={lineKey}
            className={`my-3 p-3.5 rounded-r-xl shadow-sm text-sm sm:text-base flex items-start gap-2.5 ${themeStyles.callout}`}
          >
            <Quote className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
            <div className="font-medium italic leading-relaxed">
              {renderInline(textPart, lineKey)}
            </div>
          </div>
        );
        return;
      }

      // Horizontal separator
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={lineKey} className="my-5 border-border/60" />);
        return;
      }

      // Standard Paragraph
      elements.push(
        <p key={lineKey} className="my-2 leading-relaxed tracking-wide font-normal">
          {renderInline(line, lineKey)}
        </p>
      );
    });

    return elements;
  };

  return (
    <div className={`rounded-2xl border p-5 sm:p-7 shadow-xl transition-all ${themeStyles.card}`}>
      {/* Top Controls Bar: Themes, Font Size, Copy & Edit */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Theme Palette Buttons */}
          <div className="flex items-center gap-1 bg-muted/80 dark:bg-black/40 border border-border dark:border-white/10 rounded-xl p-1 text-xs">
            <span className="px-2 text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Theme:
            </span>

            <button
              onClick={() => handleThemeChange('cosmic')}
              className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] ${
                theme === 'cosmic'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              🌌 Cosmic
            </button>

            <button
              onClick={() => handleThemeChange('emerald')}
              className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] ${
                theme === 'emerald'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              🌿 Emerald
            </button>

            <button
              onClick={() => handleThemeChange('sunset')}
              className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] ${
                theme === 'sunset'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              🌅 Sunset
            </button>

            <button
              onClick={() => handleThemeChange('sakura')}
              className={`px-2 py-1 rounded-lg font-medium transition-all text-[11px] ${
                theme === 'sakura'
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              🌸 Sakura
            </button>
          </div>

          {/* Font Size Chooser */}
          <div className="flex items-center gap-1 bg-muted/80 dark:bg-black/40 border border-border dark:border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => handleFontSizeChange('sm')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] ${
                fontSize === 'sm'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Standard Font Size"
            >
              A
            </button>
            <button
              onClick={() => handleFontSizeChange('md')}
              className={`px-2 py-1 rounded-lg font-bold text-xs ${
                fontSize === 'md'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Medium Font Size"
            >
              A+
            </button>
            <button
              onClick={() => handleFontSizeChange('lg')}
              className={`px-2 py-1 rounded-lg font-bold text-sm ${
                fontSize === 'lg'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Large Font Size"
            >
              A++
            </button>
          </div>
        </div>

        {/* Copy & Edit Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-medium transition-colors shadow-sm"
            title="Copy Note Text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            onClick={onEditClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Note</span>
          </button>
        </div>
      </div>

      {/* Note Header in Reader */}
      <div className="space-y-2 mb-6">
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${themeStyles.titleGrad}`}>
          {title || 'Untitled Note'}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {subjectName && (
            <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${themeStyles.badge}`}>
              📚 {subjectName}
            </span>
          )}
          {topicTitle && (
            <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-foreground text-[11px] font-medium">
              🎯 {topicTitle}
            </span>
          )}
          {updatedAt && (
            <span className={`text-[11px] font-mono ml-auto ${themeStyles.meta}`}>
              Updated: {new Date(updatedAt).toLocaleString()}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Note Formatted Body */}
      <div className={`space-y-1 font-sans ${fontSizes}`}>
        {renderContentLines()}
      </div>
    </div>
  );
};
