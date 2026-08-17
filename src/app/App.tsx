import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from './components/Editor';
import FontImportDialog from './components/FontImportDialog';
import KeyboardGuide from './components/KeyboardGuide';
import ListStyleDialog from './components/ListStyleDialog';
import {
  exportToPDF,
  exportToTXT,
  countWords,
  countCharacters,
  countCharactersNoSpaces,
} from './utils/pdfExport';
import {
  Font,
  DEFAULT_FONTS,
  loadSavedCustomFonts,
  saveCustomFonts,
  deleteCustomFont,
} from './utils/fontManager';
import { toast, Toaster } from 'sonner';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Palette, Highlighter, Eraser,
  Scissors, Copy, Clipboard, Paintbrush,
  Undo2, Redo2, Save, FilePlus, FolderOpen, Printer,
  Search, User, X, ChevronRight, ChevronDown,
  ZoomIn, ZoomOut,
  Table, Image as LucideImage, Link, MessageSquare,
  Keyboard, FileText, BookOpen, Eye,
  PanelLeft, Shapes, Quote,
  SpellCheck, Languages, Hash, Star,
  Moon, Sun, Maximize2, Minus, Check,
  Type, Columns, Layout, Globe, ArrowUpDown, Edit3,
  ChevronsRight, ChevronsLeft,
  ScanSearch, AlignVerticalJustifyCenter,
  Pilcrow, Settings2, CornerDownLeft,
  ChevronLeft, SquarePen, IndentIncrease, IndentDecrease
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Theme = 'light' | 'dark' | 'classic' | 'urdu';
type RibbonTab = 'home' | 'insert' | 'design' | 'layout' | 'references' | 'review' | 'view' | 'urdu';
type NavSection = 'outline' | 'pages' | 'search';

interface DocTab {
  id: string;
  name: string;
  content: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
  textAlign: string;
  headerContent: string;
  footerContent: string;
}

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  resolved: boolean;
  selection?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  '#FFFF00', '#00FF00', '#00FFFF', '#FF69B4',
  '#FFA500', '#FF6347', '#DDA0DD', '#98FB98',
  '#F0E68C', '#E0E0E0', '#87CEEB', '#FFB6C1',
  '#ADFF2F', '#FF00FF', '#40E0D0', '#FFA07A',
];

const LINE_SPACINGS = [
  { label: '1.0', value: '1.0' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2.0' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3.0' },
];

const TABLE_MAX = 8;

// ─── Ribbon Primitives ────────────────────────────────────────────────────────

const RBtn = ({
  icon: Icon, label, onClick, active = false, disabled = false, showLabel = false, danger = false,
}: {
  icon: any; label: string; onClick?: () => void;
  active?: boolean; disabled?: boolean; showLabel?: boolean; danger?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={[
      'flex items-center justify-center gap-1 rounded px-1.5 py-1 transition-colors select-none text-[11px] font-medium',
      disabled ? 'opacity-40 cursor-not-allowed' :
        danger ? 'text-red-600 hover:bg-red-50 cursor-pointer' :
          active ? 'bg-[#c7e0f4] text-[#004578] ring-1 ring-[#a9c9ea]' :
            'text-[#323130] hover:bg-[#edebe9] cursor-pointer dark:text-[#cccccc] dark:hover:bg-[#3a3a3a]',
    ].join(' ')}
  >
    <Icon size={13} strokeWidth={2} />
    {showLabel && <span className="text-[10px] leading-none whitespace-nowrap">{label}</span>}
  </button>
);

const RLargeBtn = ({
  icon: Icon, label, onClick, active = false, disabled = false,
}: {
  icon: any; label: string; onClick?: () => void; active?: boolean; disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={label}
    className={[
      'flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[44px] h-full rounded transition-colors select-none cursor-pointer',
      disabled ? 'opacity-40 cursor-not-allowed' :
        active ? 'bg-[#c7e0f4] text-[#004578]' :
          'text-[#323130] hover:bg-[#edebe9] dark:text-[#cccccc] dark:hover:bg-[#3a3a3a]',
    ].join(' ')}
  >
    <Icon size={22} strokeWidth={1.5} />
    <span className="text-[10px] leading-tight text-center max-w-[52px]">{label}</span>
  </button>
);

const RGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex h-full border-r border-[#d1d1d1] dark:border-[#444] last:border-r-0 flex-shrink-0">
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-2 pt-1.5 flex-1 min-h-0 flex-wrap content-start">
        {children}
      </div>
      <div className="text-[9px] text-[#605e5c] dark:text-[#888] text-center pb-1 px-1 leading-none whitespace-nowrap">
        {title}
      </div>
    </div>
  </div>
);

const RStack = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col justify-between h-[52px] gap-0.5 py-0.5">{children}</div>
);

const RDivider = () => (
  <div className="w-px bg-[#d1d1d1] dark:bg-[#444] h-6 mx-0.5 self-center flex-shrink-0" />
);

// ─── Highlight Color Picker ───────────────────────────────────────────────────
const HighlightPicker = ({
  current, onSelect, onClose,
}: {
  current: string; onSelect: (c: string) => void; onClose: () => void;
}) => (
  <div
    className="absolute top-full left-0 z-50 mt-0.5 bg-white dark:bg-[#252526] border border-[#d1d1d1] dark:border-[#444] rounded shadow-lg p-2"
    onMouseDown={(e) => e.preventDefault()}
  >
    <div className="text-[10px] text-[#605e5c] dark:text-[#888] mb-1.5 font-medium">Highlight Color</div>
    <div className="grid grid-cols-4 gap-1 mb-2">
      {HIGHLIGHT_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => { onSelect(c); onClose(); }}
          title={c}
          className="w-6 h-6 rounded-sm border-2 hover:scale-110 transition-transform cursor-pointer"
          style={{
            backgroundColor: c,
            borderColor: current === c ? '#2b579a' : 'transparent',
          }}
        />
      ))}
    </div>
    <button
      onClick={() => { onSelect('transparent'); onClose(); }}
      className="w-full text-[10px] text-[#605e5c] dark:text-[#888] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] py-0.5 rounded cursor-pointer"
    >
      No Highlight
    </button>
  </div>
);

// ─── Table Picker Popup ───────────────────────────────────────────────────────
const TablePicker = ({
  onInsert, onClose,
}: {
  onInsert: (rows: number, cols: number) => void; onClose: () => void;
}) => {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  return (
    <div
      className="absolute top-full left-0 z-50 mt-0.5 bg-white dark:bg-[#252526] border border-[#d1d1d1] dark:border-[#444] rounded shadow-lg p-2"
      onMouseLeave={() => setHover({ r: 0, c: 0 })}
    >
      <div className="text-[10px] text-[#605e5c] dark:text-[#888] mb-1.5 font-medium">
        {hover.r > 0 && hover.c > 0 ? `${hover.r} × ${hover.c} Table` : 'Insert Table'}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${TABLE_MAX}, 1fr)` }}>
        {Array.from({ length: TABLE_MAX }).map((_, r) =>
          Array.from({ length: TABLE_MAX }).map((_, c) => (
            <button
              key={`${r}-${c}`}
              onMouseEnter={() => setHover({ r: r + 1, c: c + 1 })}
              onClick={() => { onInsert(r + 1, c + 1); onClose(); }}
              className={[
                'w-5 h-5 rounded-sm border transition-colors cursor-pointer',
                r < hover.r && c < hover.c
                  ? 'bg-[#c7e0f4] border-[#2b579a]'
                  : 'bg-white dark:bg-[#2d2d2d] border-[#d1d1d1] dark:border-[#555] hover:border-[#2b579a]',
              ].join(' ')}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ─── Find & Replace Dialog ────────────────────────────────────────────────────
const FindReplaceDialog = ({
  onClose, findQuery, setFindQuery, replaceQuery, setReplaceQuery,
  onFindNext, onFindPrev, onReplaceOne, onReplaceAll, matchCount,
}: {
  onClose: () => void;
  findQuery: string; setFindQuery: (v: string) => void;
  replaceQuery: string; setReplaceQuery: (v: string) => void;
  onFindNext: () => void; onFindPrev: () => void;
  onReplaceOne: () => void; onReplaceAll: () => void;
  matchCount: number;
}) => {
  const [tab, setTab] = useState<'find' | 'replace'>('find');
  return (
    <div className="fixed top-36 right-4 z-[200] bg-white dark:bg-[#252526] border border-[#d1d1d1] dark:border-[#444] rounded shadow-2xl w-80">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#d1d1d1] dark:border-[#3a3a3a]">
        <div className="flex gap-3">
          {(['find', 'replace'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'text-[12px] font-medium capitalize cursor-pointer pb-0.5',
                tab === t
                  ? 'text-[#2b579a] dark:text-[#6ca4d8] border-b-2 border-[#2b579a] dark:border-[#6ca4d8]'
                  : 'text-[#605e5c] dark:text-[#888] hover:text-[#323130] dark:hover:text-[#ccc]',
              ].join(' ')}
            >
              {t === 'find' ? 'Find' : 'Replace'}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-[#605e5c] hover:text-[#201f1e] dark:text-[#888] dark:hover:text-[#ccc] cursor-pointer">
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {/* Find input */}
        <div>
          <label className="text-[10px] text-[#605e5c] dark:text-[#888] mb-0.5 block">Find</label>
          <div className="flex gap-1">
            <input
              autoFocus
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onFindNext()}
              placeholder="Search in document..."
              className="flex-1 border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-2 py-1.5 rounded-sm outline-none focus:border-[#2b579a]"
            />
          </div>
          {matchCount > 0 && (
            <div className="text-[10px] text-[#605e5c] dark:text-[#888] mt-0.5">{matchCount} matches found</div>
          )}
        </div>

        {/* Replace input (tab dependent) */}
        {tab === 'replace' && (
          <div>
            <label className="text-[10px] text-[#605e5c] dark:text-[#888] mb-0.5 block">Replace with</label>
            <input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with..."
              className="w-full border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-2 py-1.5 rounded-sm outline-none focus:border-[#2b579a]"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-1 flex-wrap pt-1">
          <button
            onClick={onFindPrev}
            className="flex items-center gap-1 px-2 py-1 text-[11px] border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer"
          >
            <ChevronLeft size={11} /> Prev
          </button>
          <button
            onClick={onFindNext}
            className="flex items-center gap-1 px-2 py-1 text-[11px] border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer"
          >
            Next <ChevronRight size={11} />
          </button>
          {tab === 'replace' && (
            <>
              <button
                onClick={onReplaceOne}
                className="px-2 py-1 text-[11px] border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer"
              >
                Replace
              </button>
              <button
                onClick={onReplaceAll}
                className="px-2 py-1 text-[11px] bg-[#2b579a] dark:bg-[#6ca4d8] text-white dark:text-[#1a1a2e] rounded-sm hover:bg-[#1a4480] cursor-pointer"
              >
                Replace All
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Word Count Dialog ────────────────────────────────────────────────────────
const WordCountDialog = ({
  onClose, words, chars, charsNoSpaces, content,
}: {
  onClose: () => void;
  words: number; chars: number; charsNoSpaces: number; content: string;
}) => {
  const paragraphs = content.split('\n').filter((l) => l.trim().length > 0).length;
  const sentences = (content.match(/[.!?۔؟!]+/g) || []).length;
  const avgWordLength = words > 0 ? Math.round(charsNoSpaces / words) : 0;
  const readingTime = Math.ceil(words / 200);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white dark:bg-[#252526] rounded shadow-2xl w-80 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1d1d1] dark:border-[#3a3a3a]">
          <span className="text-[13px] font-semibold text-[#201f1e] dark:text-[#d4d4d4] flex items-center gap-2">
            <Hash size={14} className="text-[#2b579a] dark:text-[#6ca4d8]" /> Word Count
          </span>
          <button onClick={onClose} className="text-[#605e5c] hover:text-[#201f1e] dark:text-[#888] dark:hover:text-[#ccc] cursor-pointer">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-0.5">
          {[
            { label: 'Words', value: words.toLocaleString() },
            { label: 'Characters (with spaces)', value: chars.toLocaleString() },
            { label: 'Characters (no spaces)', value: charsNoSpaces.toLocaleString() },
            { label: 'Paragraphs', value: paragraphs.toLocaleString() },
            { label: 'Sentences', value: sentences.toLocaleString() },
            { label: 'Avg word length', value: `${avgWordLength} chars` },
            { label: 'Estimated reading time', value: `${readingTime} min` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-1.5 border-b border-[#f3f2f1] dark:border-[#3a3a3a] last:border-0">
              <span className="text-[12px] text-[#605e5c] dark:text-[#888]">{label}</span>
              <span className="text-[12px] font-semibold text-[#323130] dark:text-[#ccc]">{value}</span>
            </div>
          ))}
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-1.5 text-[12px] bg-[#2b579a] dark:bg-[#6ca4d8] text-white dark:text-[#1a1a2e] rounded-sm hover:bg-[#1a4480] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Print Preview Modal ──────────────────────────────────────────────────────
const PrintPreviewModal = ({
  onClose, onPrint, content, fontFamily, fontSize, textAlign, headerContent, footerContent,
}: {
  onClose: () => void; onPrint: () => void;
  content: string; fontFamily: string; fontSize: string;
  textAlign: string; headerContent: string; footerContent: string;
}) => (
  <div className="fixed inset-0 bg-black/80 flex flex-col z-[300]">
    {/* Top bar */}
    <div className="bg-[#2b579a] px-6 py-3 flex items-center justify-between flex-shrink-0">
      <span className="text-white font-semibold text-sm flex items-center gap-2">
        <Printer size={16} /> Print Preview
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrint}
          className="px-4 py-1.5 bg-white text-[#2b579a] text-[12px] font-semibold rounded hover:bg-[#f0f0f0] cursor-pointer"
        >
          Print
        </button>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-white/20 text-white text-[12px] rounded hover:bg-white/30 cursor-pointer flex items-center gap-1"
        >
          <X size={12} /> Close
        </button>
      </div>
    </div>

    {/* Preview area */}
    <div className="flex-1 overflow-auto bg-[#525659] flex justify-center py-8">
      <div
        className="bg-white shadow-2xl"
        style={{
          width: '794px',
          minHeight: '1123px',
          padding: '72px 80px',
          fontFamily,
          fontSize,
          direction: 'rtl',
        }}
      >
        {headerContent && (
          <div className="border-b border-[#d1d1d1] pb-2 mb-4 text-[12px] text-[#605e5c] text-right">
            {headerContent}
          </div>
        )}
        <div
          style={{ textAlign: textAlign as any, direction: 'rtl' }}
          dangerouslySetInnerHTML={{ __html: content || '<p style="color:#ccc">No content to preview</p>' }}
        />
        {footerContent && (
          <div className="border-t border-[#d1d1d1] pt-2 mt-4 text-[12px] text-[#605e5c] text-right">
            {footerContent}
          </div>
        )}
        <div className="text-center text-[10px] text-[#605e5c] mt-8">— 1 —</div>
      </div>
    </div>
  </div>
);

// ─── Page Setup Dialog ────────────────────────────────────────────────────────
const PageSetupDialog = ({
  onClose, margins, onMarginsChange,
}: {
  onClose: () => void;
  margins: { top: number; right: number; bottom: number; left: number };
  onMarginsChange: (m: typeof margins) => void;
}) => {
  const [local, setLocal] = useState(margins);
  const PRESETS = [
    { label: 'Normal', top: 72, right: 80, bottom: 72, left: 80 },
    { label: 'Narrow', top: 36, right: 36, bottom: 36, left: 36 },
    { label: 'Wide', top: 72, right: 108, bottom: 72, left: 108 },
    { label: 'Moderate', top: 54, right: 54, bottom: 54, left: 54 },
  ];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white dark:bg-[#252526] rounded shadow-2xl w-80 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1d1d1] dark:border-[#3a3a3a]">
          <span className="text-[13px] font-semibold text-[#201f1e] dark:text-[#d4d4d4] flex items-center gap-2">
            <Settings2 size={14} className="text-[#2b579a] dark:text-[#6ca4d8]" /> Page Setup
          </span>
          <button onClick={onClose} className="text-[#605e5c] hover:text-[#201f1e] cursor-pointer"><X size={14} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <div className="text-[11px] font-medium text-[#323130] dark:text-[#ccc] mb-2">Margin Presets</div>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setLocal({ top: p.top, right: p.right, bottom: p.bottom, left: p.left })}
                  className="px-2 py-1.5 text-[11px] border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[#323130] dark:text-[#ccc] hover:bg-[#c7e0f4]/30 hover:border-[#2b579a] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#323130] dark:text-[#ccc] mb-2">Custom Margins (px)</div>
            <div className="grid grid-cols-2 gap-2">
              {(['top', 'right', 'bottom', 'left'] as const).map((k) => (
                <div key={k}>
                  <label className="text-[10px] text-[#605e5c] dark:text-[#888] capitalize mb-0.5 block">{k}</label>
                  <input
                    type="number"
                    value={local[k]}
                    onChange={(e) => setLocal({ ...local, [k]: Number(e.target.value) })}
                    className="w-full border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-2 py-1 rounded-sm outline-none focus:border-[#2b579a]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end px-4 pb-4">
          <button onClick={onClose} className="px-3 py-1.5 text-[11px] border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => { onMarginsChange(local); onClose(); }}
            className="px-3 py-1.5 text-[11px] bg-[#2b579a] text-white rounded-sm hover:bg-[#1a4480] cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Context Menu ─────────────────────────────────────────────────────────────
const ContextMenuComp = ({
  x, y, onClose, onBold, onItalic, onUnderline, onCopy, onCut, onPaste, onSelectAll, onAddComment,
}: {
  x: number; y: number; onClose: () => void;
  onBold: () => void; onItalic: () => void; onUnderline: () => void;
  onCopy: () => void; onCut: () => void; onPaste: () => void;
  onSelectAll: () => void; onAddComment: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => onClose();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const items = [
    { label: 'Cut', icon: Scissors, action: onCut, shortcut: 'Ctrl+X' },
    { label: 'Copy', icon: Copy, action: onCopy, shortcut: 'Ctrl+C' },
    { label: 'Paste', icon: Clipboard, action: onPaste, shortcut: 'Ctrl+V' },
    { label: 'Select All', icon: SquarePen, action: onSelectAll, shortcut: 'Ctrl+A' },
    null,
    { label: 'Bold', icon: Bold, action: onBold, shortcut: 'Ctrl+B' },
    { label: 'Italic', icon: Italic, action: onItalic, shortcut: 'Ctrl+I' },
    { label: 'Underline', icon: Underline, action: onUnderline, shortcut: 'Ctrl+U' },
    null,
    { label: 'Add Comment', icon: MessageSquare, action: onAddComment, shortcut: '' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-[500] bg-white dark:bg-[#252526] border border-[#d1d1d1] dark:border-[#444] rounded shadow-xl py-1 min-w-[180px]"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((item, i) =>
        item === null ? (
          <div key={i} className="h-px bg-[#d1d1d1] dark:bg-[#3a3a3a] mx-2 my-1" />
        ) : (
          <button
            key={item.label}
            onClick={() => { item.action(); onClose(); }}
            className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-[12px] text-[#323130] dark:text-[#ccc] hover:bg-[#c7e0f4]/30 dark:hover:bg-[#264f78]/30 cursor-pointer text-left"
          >
            <span className="flex items-center gap-2">
              <item.icon size={13} className="text-[#605e5c] dark:text-[#888]" />
              {item.label}
            </span>
            {item.shortcut && (
              <span className="text-[10px] text-[#a0a0a0] dark:text-[#666]">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
};

// ─── Home Ribbon ──────────────────────────────────────────────────────────────
const HomeRibbon = ({
  onBold, onItalic, onUnderline, onStrike, onSuperscript, onSubscript,
  onAlignLeft, onAlignCenter, onAlignRight, onAlignJustify,
  onBullet, onNumbered, onIndent, onOutdent, onLineSpacing, lineSpacing,
  onCut, onCopy, onPaste, onClearFormat, onHighlight,
  onFontChange, onSizeChange, onColorChange,
  onHeading1, onHeading2, onHeading3, onNormal, onShowWordCount,
  fontFamily, fontSize, textColor, availableFonts,
}: any) => {
  const SIZES = ['8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72'];
  const sizeVal = fontSize.replace('px', '');
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex h-full overflow-x-auto">
      {/* Clipboard */}
      <RGroup title="Clipboard">
        <RLargeBtn icon={Clipboard} label="Paste" onClick={onPaste} />
        <RStack>
          <RBtn icon={Scissors} label="Cut" onClick={onCut} showLabel />
          <RBtn icon={Copy} label="Copy" onClick={onCopy} showLabel />
          <RBtn icon={Paintbrush} label="Format Painter" showLabel />
        </RStack>
      </RGroup>

      {/* Font */}
      <RGroup title="Font">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <select
              value={fontFamily}
              onChange={(e) => onFontChange(e.target.value)}
              className="border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-1 py-0.5 rounded-sm outline-none focus:border-[#2b579a] w-28 cursor-pointer"
            >
              {availableFonts.map((f: Font) => (
                <option key={f.family} value={f.family}>{f.name}</option>
              ))}
            </select>
            <select
              value={sizeVal}
              onChange={(e) => onSizeChange(e.target.value + 'px')}
              className="border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-1 py-0.5 rounded-sm outline-none focus:border-[#2b579a] w-14 cursor-pointer"
            >
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={() => onSizeChange((parseInt(sizeVal) + 2) + 'px')}
              className="px-1 py-0.5 rounded text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer text-[12px] font-bold"
              title="Increase font size"
            >A⁺</button>
            <button
              onClick={() => onSizeChange(Math.max(6, parseInt(sizeVal) - 2) + 'px')}
              className="px-1 py-0.5 rounded text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer text-[11px]"
              title="Decrease font size"
            >A⁻</button>
          </div>
          <div className="flex items-center gap-0.5 flex-wrap">
            <RBtn icon={Bold} label="Bold (Ctrl+B)" onClick={onBold} />
            <RBtn icon={Italic} label="Italic (Ctrl+I)" onClick={onItalic} />
            <RBtn icon={Underline} label="Underline (Ctrl+U)" onClick={onUnderline} />
            <RBtn icon={Strikethrough} label="Strikethrough" onClick={onStrike} />
            <RDivider />
            {/* Superscript */}
            <button
              onClick={onSuperscript}
              title="Superscript"
              className="px-1.5 py-0.5 rounded text-[11px] text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer leading-none"
            >
              x<sup className="text-[8px]">2</sup>
            </button>
            {/* Subscript */}
            <button
              onClick={onSubscript}
              title="Subscript"
              className="px-1.5 py-0.5 rounded text-[11px] text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer leading-none"
            >
              x<sub className="text-[8px]">2</sub>
            </button>
            <RDivider />
            {/* Font Color */}
            <div className="flex items-center gap-0.5">
              <button
                title="Font Color"
                onClick={() => { const el = document.getElementById('fontColorPicker'); el?.click(); }}
                className="flex flex-col items-center gap-0 px-1.5 py-0.5 rounded hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer"
              >
                <Palette size={13} className="text-[#323130] dark:text-[#ccc]" />
                <div className="w-4 h-1 rounded-full" style={{ backgroundColor: textColor }} />
              </button>
              <input
                id="fontColorPicker"
                type="color"
                value={textColor}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-0 h-0 opacity-0 absolute"
              />
            </div>
            {/* Highlight */}
            <div className="relative" ref={highlightRef}>
              <div className="flex items-center rounded hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a]">
                <button
                  onClick={() => onHighlight(highlightColor)}
                  title="Highlight"
                  className="px-1 py-0.5 cursor-pointer flex flex-col items-center gap-0"
                >
                  <Highlighter size={13} className="text-[#323130] dark:text-[#ccc]" />
                  <div className="w-4 h-1 rounded-full" style={{ backgroundColor: highlightColor }} />
                </button>
                <button
                  onClick={() => setShowHighlight((v) => !v)}
                  className="px-0.5 cursor-pointer"
                >
                  <ChevronDown size={10} className="text-[#605e5c] dark:text-[#888]" />
                </button>
              </div>
              {showHighlight && (
                <HighlightPicker
                  current={highlightColor}
                  onSelect={(c) => { setHighlightColor(c); onHighlight(c); }}
                  onClose={() => setShowHighlight(false)}
                />
              )}
            </div>
            <RBtn icon={Eraser} label="Clear Formatting" onClick={onClearFormat} />
          </div>
        </div>
      </RGroup>

      {/* Paragraph */}
      <RGroup title="Paragraph">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-0.5">
            <RBtn icon={AlignRight} label="Align Right" onClick={onAlignRight} />
            <RBtn icon={AlignCenter} label="Align Center" onClick={onAlignCenter} />
            <RBtn icon={AlignLeft} label="Align Left" onClick={onAlignLeft} />
            <RBtn icon={AlignJustify} label="Justify" onClick={onAlignJustify} />
            <RDivider />
            {/* Line spacing */}
            <div className="relative">
              <button
                onClick={() => setShowLineSpacing((v) => !v)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer"
                title="Line Spacing"
              >
                <AlignVerticalJustifyCenter size={13} />
                <ChevronDown size={9} />
              </button>
              {showLineSpacing && (
                <div className="absolute top-full left-0 z-50 mt-0.5 bg-white dark:bg-[#252526] border border-[#d1d1d1] dark:border-[#444] rounded shadow-lg overflow-hidden">
                  {LINE_SPACINGS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { onLineSpacing(s.value); setShowLineSpacing(false); }}
                      className={[
                        'w-full text-left px-3 py-1.5 text-[11px] hover:bg-[#c7e0f4]/30 dark:hover:bg-[#264f78]/30 cursor-pointer',
                        lineSpacing === s.value
                          ? 'text-[#2b579a] dark:text-[#6ca4d8] font-semibold'
                          : 'text-[#323130] dark:text-[#ccc]',
                      ].join(' ')}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <RBtn icon={List} label="Bullets" onClick={onBullet} />
            <RBtn icon={ListOrdered} label="Numbering" onClick={onNumbered} />
            <RDivider />
            <RBtn icon={IndentDecrease} label="Decrease Indent" onClick={onOutdent} />
            <RBtn icon={IndentIncrease} label="Increase Indent" onClick={onIndent} />
          </div>
        </div>
      </RGroup>

      {/* Styles */}
      <RGroup title="Styles">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {[
              { label: 'H1', action: onHeading1, cls: 'font-bold text-sm' },
              { label: 'H2', action: onHeading2, cls: 'font-semibold' },
              { label: 'H3', action: onHeading3, cls: '' },
              { label: '¶ Normal', action: onNormal, cls: '' },
            ].map(({ label, action, cls }) => (
              <button
                key={label}
                onClick={action}
                className={`flex items-center gap-1 px-2 py-0.5 border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[11px] text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer ${cls}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button className="px-2 py-0.5 border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[11px] italic text-[#605e5c] dark:text-[#888] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer">
              Quote
            </button>
            <button
              onClick={onShowWordCount}
              className="flex items-center gap-1 px-2 py-0.5 border border-[#d1d1d1] dark:border-[#555] rounded-sm text-[11px] text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer"
            >
              <Hash size={11} /> Count
            </button>
          </div>
        </div>
      </RGroup>
    </div>
  );
};

// ─── Insert Ribbon ────────────────────────────────────────────────────────────
const InsertRibbon = ({
  onInsertTable, onInsertImage, onInsertLink, onInsertPageBreak, onInsertHR,
}: {
  onInsertTable: (r: number, c: number) => void;
  onInsertImage: () => void; onInsertLink: () => void;
  onInsertPageBreak: () => void; onInsertHR: () => void;
}) => {
  const [showTable, setShowTable] = useState(false);
  return (
    <div className="flex h-full overflow-x-auto">
      <RGroup title="Tables">
        <div className="relative">
          <button
            onClick={() => setShowTable((v) => !v)}
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 min-w-[44px] h-full rounded transition-colors text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer"
          >
            <Table size={22} strokeWidth={1.5} />
            <span className="text-[10px] leading-tight">Table</span>
          </button>
          {showTable && (
            <TablePicker
              onInsert={onInsertTable}
              onClose={() => setShowTable(false)}
            />
          )}
        </div>
      </RGroup>
      <RGroup title="Illustrations">
        <RLargeBtn icon={LucideImage} label="Picture" onClick={onInsertImage} />
        <RLargeBtn icon={Shapes} label="Shapes" />
      </RGroup>
      <RGroup title="Text">
        <RLargeBtn icon={Type} label="Text Box" />
        <RLargeBtn icon={Star} label="WordArt" />
        <RLargeBtn icon={Link} label="Hyperlink" onClick={onInsertLink} />
      </RGroup>
      <RGroup title="Page">
        <RStack>
          <RBtn icon={FileText} label="Header" showLabel />
          <RBtn icon={FileText} label="Footer" showLabel />
          <RBtn icon={Hash} label="Page Numbers" showLabel />
        </RStack>
        <RStack>
          <RBtn icon={CornerDownLeft} label="Page Break" onClick={onInsertPageBreak} showLabel />
          <RBtn icon={Minus} label="Horizontal Rule" onClick={onInsertHR} showLabel />
        </RStack>
      </RGroup>
      <RGroup title="Comments">
        <RLargeBtn icon={MessageSquare} label="Comment" />
      </RGroup>
    </div>
  );
};

// ─── Design Ribbon ────────────────────────────────────────────────────────────
const DesignRibbon = ({ theme, onThemeChange }: { theme: Theme; onThemeChange: (t: Theme) => void }) => (
  <div className="flex h-full overflow-x-auto">
    <RGroup title="Document Formatting">
      {['Default', 'Elegant', 'Professional', 'Academic', 'Traditional'].map((t) => (
        <button key={t} className="flex flex-col items-center gap-1 px-2 py-1 rounded hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer min-w-[52px]">
          <div className="w-10 h-12 border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] rounded-sm shadow-sm flex flex-col items-start p-1 gap-0.5">
            <div className="w-full h-1 bg-[#2b579a] dark:bg-[#6ca4d8] rounded-full" />
            <div className="w-3/4 h-px bg-[#323130] dark:bg-[#ccc]" />
            <div className="w-full h-px bg-[#d1d1d1] dark:bg-[#444]" />
            <div className="w-full h-px bg-[#d1d1d1] dark:bg-[#444]" />
          </div>
          <span className="text-[9px] text-[#323130] dark:text-[#ccc]">{t}</span>
        </button>
      ))}
    </RGroup>
    <RGroup title="App Theme">
      <div className="flex flex-col gap-1 py-1">
        {(['light', 'dark', 'classic', 'urdu'] as Theme[]).map((t) => (
          <button
            key={t}
            onClick={() => onThemeChange(t)}
            className={[
              'flex items-center gap-2 px-2 py-0.5 rounded text-[11px] cursor-pointer capitalize',
              theme === t
                ? 'bg-[#c7e0f4] text-[#004578]'
                : 'text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a]',
            ].join(' ')}
          >
            {theme === t && <Check size={11} />}
            {t}
          </button>
        ))}
      </div>
    </RGroup>
    <RGroup title="Page Background">
      <RLargeBtn icon={Palette} label="Colors" />
      <RLargeBtn icon={Type} label="Fonts" />
    </RGroup>
  </div>
);

// ─── Layout Ribbon ────────────────────────────────────────────────────────────
const LayoutRibbon = ({ onOpenPageSetup }: { onOpenPageSetup: () => void }) => (
  <div className="flex h-full overflow-x-auto">
    <RGroup title="Page Setup">
      <RStack>
        <RBtn icon={Layout} label="Margins" onClick={onOpenPageSetup} showLabel />
        <RBtn icon={Layout} label="Orientation" showLabel />
        <RBtn icon={Layout} label="Size" showLabel />
      </RStack>
      <RStack>
        <RBtn icon={Columns} label="Columns" showLabel />
        <RBtn icon={Layout} label="Breaks" showLabel />
        <RBtn icon={Hash} label="Line Numbers" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Paragraph">
      <RStack>
        <RBtn icon={ChevronsRight} label="Indent Left" showLabel />
        <RBtn icon={ChevronsLeft} label="Indent Right" showLabel />
      </RStack>
      <RStack>
        <RBtn icon={ArrowUpDown} label="Before" showLabel />
        <RBtn icon={ArrowUpDown} label="After" showLabel />
      </RStack>
    </RGroup>
  </div>
);

// ─── References Ribbon ───────────────────────────────────────────────────────
const ReferencesRibbon = () => (
  <div className="flex h-full overflow-x-auto">
    <RGroup title="Table of Contents">
      <RLargeBtn icon={BookOpen} label="Table of Contents" />
    </RGroup>
    <RGroup title="Footnotes">
      <RStack>
        <RBtn icon={FileText} label="Insert Footnote" showLabel />
        <RBtn icon={FileText} label="Insert Endnote" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Citations">
      <RStack>
        <RBtn icon={Quote} label="Insert Citation" showLabel />
        <RBtn icon={BookOpen} label="Bibliography" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Captions">
      <RStack>
        <RBtn icon={Hash} label="Insert Caption" showLabel />
        <RBtn icon={BookOpen} label="Index" showLabel />
      </RStack>
    </RGroup>
  </div>
);

// ─── Review Ribbon ────────────────────────────────────────────────────────────
const ReviewRibbon = ({
  showComments, onToggleComments, onAddComment,
}: {
  showComments: boolean; onToggleComments: () => void; onAddComment: () => void;
}) => (
  <div className="flex h-full overflow-x-auto">
    <RGroup title="Proofing">
      <RLargeBtn icon={SpellCheck} label="Spell Check" />
      <RLargeBtn icon={SpellCheck} label="Grammar" />
    </RGroup>
    <RGroup title="Comments">
      <RStack>
        <RBtn icon={MessageSquare} label="New Comment" onClick={onAddComment} showLabel />
        <RBtn icon={MessageSquare} label="Show Comments" onClick={onToggleComments} active={showComments} showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Tracking">
      <RStack>
        <RBtn icon={Edit3} label="Track Changes" showLabel />
        <RBtn icon={Check} label="Accept" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Language">
      <RStack>
        <RBtn icon={Languages} label="Translate" showLabel />
        <RBtn icon={Globe} label="Set Language" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Compare">
      <RLargeBtn icon={ScanSearch} label="Compare" />
    </RGroup>
  </div>
);

// ─── View Ribbon ──────────────────────────────────────────────────────────────
const ViewRibbon = ({
  showNav, onToggleNav, showSidebar, onToggleSidebar,
  zoom, onZoomChange, showParaMarks, onToggleParaMarks,
  onPrintPreview,
}: any) => (
  <div className="flex h-full overflow-x-auto">
    <RGroup title="Views">
      <RLargeBtn icon={FileText} label="Print Layout" active />
      <RLargeBtn icon={Eye} label="Read Mode" />
      <RLargeBtn icon={Layout} label="Web Layout" />
      <RLargeBtn icon={Printer} label="Print Preview" onClick={onPrintPreview} />
    </RGroup>
    <RGroup title="Show">
      <RStack>
        <RBtn icon={PanelLeft} label="Navigation Pane" onClick={onToggleNav} active={showNav} showLabel />
        <RBtn icon={Pilcrow} label="Formatting Marks" onClick={onToggleParaMarks} active={showParaMarks} showLabel />
        <RBtn icon={Eye} label="Gridlines" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Zoom">
      <RLargeBtn icon={ZoomIn} label="Zoom In" onClick={() => onZoomChange(Math.min(200, zoom + 10))} />
      <RLargeBtn icon={ZoomOut} label="Zoom Out" onClick={() => onZoomChange(Math.max(50, zoom - 10))} />
      <RLargeBtn icon={Eye} label="100%" onClick={() => onZoomChange(100)} />
    </RGroup>
    <RGroup title="Window">
      <RStack>
        <RBtn icon={Layout} label="Side by Side" showLabel />
        <RBtn icon={Layout} label="Multiple Pages" showLabel />
        <RBtn icon={PanelLeft} label="Right Sidebar" onClick={onToggleSidebar} active={showSidebar} showLabel />
      </RStack>
    </RGroup>
  </div>
);

// ─── Urdu Ribbon ──────────────────────────────────────────────────────────────
const UrduRibbon = ({
  isPhoneticMode, onTogglePhonetic, onAlignRight, onManageFonts, onShowHelp, fontFamily, availableFonts, onFontChange,
}: any) => (
  <div className="flex h-full overflow-x-auto">
    <RGroup title="Urdu Keyboard">
      <RLargeBtn icon={Keyboard} label="Phonetic" onClick={onTogglePhonetic} active={isPhoneticMode} />
      <RStack>
        <RBtn icon={Keyboard} label="CRULP Layout" showLabel />
        <RBtn icon={Keyboard} label="InPage Layout" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Nastaliq Fonts">
      <div className="flex flex-col gap-1 py-1">
        <select
          value={fontFamily}
          onChange={(e) => onFontChange(e.target.value)}
          className="border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-1.5 py-0.5 rounded-sm outline-none focus:border-[#2b579a] cursor-pointer w-36"
          style={{ fontFamily, direction: 'rtl' }}
        >
          {availableFonts.map((f: Font) => (
            <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          onClick={onManageFonts}
          className="text-[11px] text-[#2b579a] dark:text-[#6ca4d8] hover:underline cursor-pointer text-right px-1"
        >
          + Import Font
        </button>
      </div>
    </RGroup>
    <RGroup title="Direction">
      <RLargeBtn icon={AlignRight} label="RTL Text" onClick={onAlignRight} />
    </RGroup>
    <RGroup title="Urdu Tools">
      <RStack>
        <RBtn icon={SpellCheck} label="Urdu Dictionary" showLabel />
        <RBtn icon={Languages} label="Transliteration" showLabel />
        <RBtn icon={Globe} label="Urdu Grammar" showLabel />
      </RStack>
    </RGroup>
    <RGroup title="Help">
      <RLargeBtn icon={Keyboard} label="Keyboard Guide" onClick={onShowHelp} />
    </RGroup>
  </div>
);

// ─── Word-style Start Screen ──────────────────────────────────────────────────
const WordStartScreen = ({
  onNew, onLoadSample, theme, onThemeChange,
}: {
  onNew: () => void; onLoadSample: () => void;
  theme: Theme; onThemeChange: (t: Theme) => void;
}) => (
  <div className="h-screen flex overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
    <div className="w-64 flex-shrink-0 bg-[#2b579a] dark:bg-[#1a3a6b] flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">لفظ نگار</div>
            <div className="text-white/60 text-[10px] leading-tight">Lafz-e-Nigar</div>
          </div>
        </div>
        <nav className="space-y-0.5">
          {[
            { icon: FilePlus, label: 'New', action: onNew },
            { icon: FolderOpen, label: 'Open', action: onNew },
          ].map(({ icon: Icon, label, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-white/80 hover:bg-white/15 hover:text-white text-sm transition-colors cursor-pointer text-left"
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="px-6 mt-auto pb-6">
        <div className="text-[10px] text-white/40 mb-2">Theme</div>
        <div className="grid grid-cols-2 gap-1">
          {(['light', 'dark', 'classic', 'urdu'] as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => onThemeChange(t)}
              className={[
                'text-[10px] px-2 py-1 rounded-sm capitalize transition-colors cursor-pointer',
                theme === t ? 'bg-white/30 text-white' : 'text-white/50 hover:bg-white/15 hover:text-white',
              ].join(' ')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
    <div className="flex-1 bg-[#f3f2f1] dark:bg-[#1e1e1e] overflow-auto flex flex-col">
      <div className="p-8 pb-4">
        <h2 className="text-xl font-semibold text-[#201f1e] dark:text-[#d4d4d4] mb-6">New</h2>
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Blank Document', sub: 'خالی', action: onNew },
            { label: 'Academic Essay', sub: 'مضمون', action: onNew },
            { label: 'Letter', sub: 'خط', action: onNew },
            { label: 'Report', sub: 'رپورٹ', action: onNew },
            { label: 'Resume', sub: 'سی وی', action: onNew },
            { label: 'Sample Text', sub: 'نمونہ', action: onLoadSample },
          ].map(({ label, sub, action }) => (
            <button
              key={label}
              onClick={action}
              className="flex flex-col rounded border border-[#d1d1d1] dark:border-[#444] overflow-hidden bg-white dark:bg-[#252526] hover:border-[#2b579a] dark:hover:border-[#6ca4d8] hover:shadow-md transition-all cursor-pointer text-left"
            >
              <div className="h-28 flex items-center justify-center p-4 bg-[#f9f9f9] dark:bg-[#2d2d2d]">
                <div className="w-full max-w-[80px]">
                  <div className="h-1 bg-[#2b579a] rounded mb-1 w-full" />
                  <div className="h-px bg-[#d1d1d1] rounded mb-0.5 w-3/4" />
                  <div className="h-px bg-[#d1d1d1] rounded mb-0.5 w-full" />
                  <div className="h-px bg-[#d1d1d1] rounded mb-1 w-2/3" />
                  <div className="text-[10px] text-[#2b579a] text-right" style={{ fontFamily: "'Noto Nastaliq Urdu', serif", direction: 'rtl' }}>{sub}</div>
                </div>
              </div>
              <div className="px-3 py-2 border-t border-[#e1dfdd] dark:border-[#3a3a3a]">
                <div className="text-[11px] font-medium text-[#201f1e] dark:text-[#d4d4d4]">{label}</div>
              </div>
            </button>
          ))}
        </div>
        <h2 className="text-xl font-semibold text-[#201f1e] dark:text-[#d4d4d4] mb-4">Recent</h2>
        <div className="space-y-0.5">
          {[
            { name: 'Urdu Essay - برصغیر کی تاریخ', date: 'Today, 2:30 PM', size: '24 KB' },
            { name: 'Research Paper - تحقیقی مقالہ', date: 'Yesterday, 11:00 AM', size: '56 KB' },
            { name: 'Sample Document - نمونہ دستاویز', date: 'Jun 12', size: '12 KB' },
            { name: 'Letter - خط', date: 'Jun 10', size: '8 KB' },
          ].map(({ name, date, size }) => (
            <button
              key={name}
              onClick={onLoadSample}
              className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-[#edebe9] dark:hover:bg-[#2d2d2d] cursor-pointer group transition-colors"
            >
              <FileText size={18} className="text-[#2b579a] dark:text-[#6ca4d8] flex-shrink-0" />
              <div className="flex-1 text-left min-w-0">
                <div className="text-[12px] font-medium text-[#201f1e] dark:text-[#d4d4d4] truncate">{name}</div>
                <div className="text-[10px] text-[#605e5c] dark:text-[#888]">{date} · {size}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // Document state
  const [content, setContent] = useState('');
  const [fontSize, setFontSize] = useState('20px');
  const [fontFamily, setFontFamily] = useState("'Noto Nastaliq Urdu', serif");
  const [textColor, setTextColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('right');
  const [isPhoneticMode, setIsPhoneticMode] = useState(true);
  const [documentName, setDocumentName] = useState('Untitled Document');
  const [hasDocument, setHasDocument] = useState(false);
  const [availableFonts, setAvailableFonts] = useState<Font[]>([...DEFAULT_FONTS]);
  const [autoSaved, setAutoSaved] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [lineSpacing, setLineSpacing] = useState('1.5');
  const [headerContent, setHeaderContent] = useState('');
  const [footerContent, setFooterContent] = useState('');
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [margins, setMargins] = useState({ top: 72, right: 80, bottom: 72, left: 80 });

  // UI state
  const [theme, setTheme] = useState<Theme>('light');
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [showNav, setShowNav] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [navSection, setNavSection] = useState<NavSection>('outline');
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [showParaMarks, setShowParaMarks] = useState(false);
  const [isEditingZoom, setIsEditingZoom] = useState(false);
  const [zoomInput, setZoomInput] = useState('100');

  // Document tabs
  const [docTabs, setDocTabs] = useState<DocTab[]>([]);
  const [activeDocId, setActiveDocId] = useState('main');

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showAddComment, setShowAddComment] = useState(false);

  // Dialogs
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showPageSetup, setShowPageSetup] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState('');
  const [exportType, setExportType] = useState<'pdf' | 'txt'>('pdf');
  const [showKeyboardGuide, setShowKeyboardGuide] = useState(false);
  const [showFontManager, setShowFontManager] = useState(false);
  const [showListStyleDialog, setShowListStyleDialog] = useState(false);
  const [currentListType, setCurrentListType] = useState<'bullet' | 'numbered'>('bullet');

  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; show: boolean }>({
    x: 0, y: 0, show: false,
  });

  const words = countWords(content);
  const characters = countCharacters(content);
  const charactersNoSpaces = countCharactersNoSpaces(content);
  const pageCount = Math.max(1, Math.ceil(words / 400));

  // ── Load from localStorage ─────────────────────────────────────────────────
  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('urdu-doc-content');
      const savedName = localStorage.getItem('urdu-doc-name');
      const savedHasDoc = localStorage.getItem('urdu-doc-has');
      const savedFont = localStorage.getItem('urdu-doc-font');
      const savedTheme = localStorage.getItem('urdu-doc-theme') as Theme | null;
      const savedHeader = localStorage.getItem('urdu-doc-header');
      const savedFooter = localStorage.getItem('urdu-doc-footer');
      const savedComments = localStorage.getItem('urdu-doc-comments');

      if (savedHasDoc === 'true' && savedContent) {
        setContent(savedContent);
        setDocumentName(savedName || 'Untitled Document');
        setHasDocument(true);
      }
      if (savedFont) setFontFamily(savedFont);
      if (savedTheme) setTheme(savedTheme);
      if (savedHeader) setHeaderContent(savedHeader);
      if (savedFooter) setFooterContent(savedFooter);
      if (savedComments) setComments(JSON.parse(savedComments));

      const customFonts = loadSavedCustomFonts();
      if (customFonts.length > 0) setAvailableFonts([...DEFAULT_FONTS, ...customFonts]);
    } catch {}
  }, []);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasDocument) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem('urdu-doc-content', content);
        localStorage.setItem('urdu-doc-name', documentName);
        localStorage.setItem('urdu-doc-has', 'true');
        localStorage.setItem('urdu-doc-font', fontFamily);
        localStorage.setItem('urdu-doc-theme', theme);
        localStorage.setItem('urdu-doc-header', headerContent);
        localStorage.setItem('urdu-doc-footer', footerContent);
        localStorage.setItem('urdu-doc-comments', JSON.stringify(comments));
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [content, documentName, hasDocument, fontFamily, theme, headerContent, footerContent, comments]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!hasDocument) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 'f') { e.preventDefault(); setShowFindReplace(true); }
      if (ctrl && e.key === 'h') { e.preventDefault(); setShowFindReplace(true); }
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); }
      if (ctrl && e.key === 'p') { e.preventDefault(); setShowPrintPreview(true); }
      if (e.key === 'Escape') {
        setShowFindReplace(false);
        setShowWordCount(false);
        setShowPrintPreview(false);
        setContextMenu({ x: 0, y: 0, show: false });
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [hasDocument, content, documentName, fontFamily]);

  // ── Apply line spacing ─────────────────────────────────────────────────────
  useEffect(() => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (editor) editor.style.lineHeight = lineSpacing;
  }, [lineSpacing]);

  // ── Apply paragraph marks ──────────────────────────────────────────────────
  useEffect(() => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (editor) {
      editor.classList.toggle('show-para-marks', showParaMarks);
    }
  }, [showParaMarks]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const applyFormat = (cmd: string, value?: string) => {
    try { document.execCommand(cmd, false, value); } catch {}
  };

  const handleSave = () => {
    try {
      localStorage.setItem('urdu-doc-content', content);
      localStorage.setItem('urdu-doc-name', documentName);
      localStorage.setItem('urdu-doc-has', 'true');
      toast.success('Saved');
    } catch {
      toast.error('Save failed');
    }
  };

  const handleNewDocument = () => {
    if (content && hasDocument) {
      if (!window.confirm('Create a new document? Unsaved changes will be lost.')) return;
    }
    // Save current as tab
    if (hasDocument && content) {
      setDocTabs((prev) => {
        const existing = prev.find((t) => t.id === activeDocId);
        if (existing) {
          return prev.map((t) => t.id === activeDocId ? { ...t, content, name: documentName, fontFamily, fontSize, textColor, textAlign, headerContent, footerContent } : t);
        }
        return [...prev, {
          id: activeDocId, name: documentName, content, fontFamily, fontSize,
          textColor, textAlign, headerContent, footerContent,
        }];
      });
    }
    const newId = `doc-${Date.now()}`;
    setActiveDocId(newId);
    setContent('');
    setDocumentName('Untitled Document');
    setHasDocument(true);
    setTextAlign('right');
    setFontSize('20px');
    setFontFamily(DEFAULT_FONTS[0].family);
    setTextColor('#000000');
    setHeaderContent('');
    setFooterContent('');
    toast.success('New document created');
  };

  const handleLoadSample = () => {
    const sample = `اردو ایک خوبصورت اور بھرپور زبان ہے

یہ ایک نمونہ دستاویز ہے جو لفظ نگار کی صلاحیتوں کو ظاہر کرتا ہے۔

اردو زبان برصغیر پاک و ہند کی ایک اہم زبان ہے۔ یہ پاکستان کی قومی زبان اور ہندوستان کی سرکاری زبانوں میں سے ایک ہے۔ اردو کی خوبصورتی اس کی نستعلیق رسم الخط میں مضمر ہے۔

لفظ نگار کی خصوصیات:
• فونیٹک ٹائپنگ - رومن حروف میں لکھیں اور اردو میں حاصل کریں
• متعدد فونٹس - مختلف اردو فونٹس میں سے انتخاب کریں
• کسٹم فونٹ امپورٹ - اپنے پسندیدہ فونٹس اپ لوڈ کریں
• دائیں سے بائیں تحریر کی مکمل معاونت
• پی ڈی ایف اور ٹی ایکس ٹی فائلوں میں برآمد کریں`;

    setContent(sample);
    setDocumentName('Sample Document - نمونہ دستاویز');
    setHasDocument(true);
    setTextAlign('right');
    toast.success('Sample document loaded');
  };

  const handleExportPDF = () => {
    setExportType('pdf');
    setExportFileName(documentName.replace(/\s+/g, '_'));
    setShowExportDialog(true);
  };

  const handleExportTXT = () => {
    setExportType('txt');
    setExportFileName(documentName.replace(/\s+/g, '_'));
    setShowExportDialog(true);
  };

  const confirmExport = async () => {
    try {
      if (exportType === 'pdf') {
        await exportToPDF(content, { fileName: exportFileName, title: documentName, author: 'Lafz-e-Nigar', fontFamily });
        toast.success('PDF exported');
      } else {
        exportToTXT(content, exportFileName);
        toast.success('TXT exported');
      }
      setShowExportDialog(false);
    } catch {
      toast.error('Export failed');
    }
  };

  const handleFontImported = (font: Font) => {
    const updated = [...availableFonts, font];
    setAvailableFonts(updated);
    saveCustomFonts(updated);
    toast.success(`Font "${font.name}" imported`);
  };

  const handleFontDeleted = (family: string) => {
    const updated = deleteCustomFont(family, availableFonts);
    setAvailableFonts(updated);
    if (fontFamily === family) setFontFamily(DEFAULT_FONTS[0].family);
    toast.success('Font deleted');
  };

  // Find & Replace
  const handleFindNext = useCallback(() => {
    if (!findQuery) return;
    window.find(findQuery, false, false, true, false, false, false);
  }, [findQuery]);

  const handleFindPrev = useCallback(() => {
    if (!findQuery) return;
    window.find(findQuery, false, true, true, false, false, false);
  }, [findQuery]);

  const handleReplaceOne = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.toString().toLowerCase() === findQuery.toLowerCase()) {
      document.execCommand('insertText', false, replaceQuery);
    }
    handleFindNext();
  }, [findQuery, replaceQuery, handleFindNext]);

  const handleReplaceAll = useCallback(() => {
    const editor = document.querySelector('[contenteditable="true"]') as HTMLElement;
    if (!editor || !findQuery) return;
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    const count = (editor.innerHTML.match(regex) || []).length;
    if (count === 0) { toast.info('No matches found'); return; }
    editor.innerHTML = editor.innerHTML.replace(regex, replaceQuery);
    setContent(editor.innerHTML);
    toast.success(`Replaced ${count} occurrence${count !== 1 ? 's' : ''}`);
  }, [findQuery, replaceQuery]);

  // Update match count when findQuery changes
  useEffect(() => {
    if (!findQuery) { setMatchCount(0); return; }
    const text = content.replace(/<[^>]*>/g, '');
    const escaped = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = text.match(new RegExp(escaped, 'gi'));
    setMatchCount(m ? m.length : 0);
  }, [findQuery, content]);

  // Insert table
  const handleInsertTable = (rows: number, cols: number) => {
    let html = '<table style="border-collapse:collapse;width:100%;direction:rtl;margin:8px 0;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += `<td style="border:1px solid #d1d1d1;padding:6px 10px;min-width:60px;min-height:24px;"> </td>`;
      }
      html += '</tr>';
    }
    html += '</table><p></p>';
    document.execCommand('insertHTML', false, html);
    toast.success(`${rows}×${cols} table inserted`);
  };

  // Insert page break
  const handleInsertPageBreak = () => {
    document.execCommand('insertHTML', false, '<div style="page-break-after:always;border-bottom:2px dashed #c7e0f4;margin:16px 0;display:block;height:24px;text-align:center;"><span style="font-size:10px;color:#a0a0a0;">— Page Break —</span></div>');
  };

  // Insert horizontal rule
  const handleInsertHR = () => {
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid #d1d1d1;margin:12px 0;" /><p></p>');
  };

  // Insert hyperlink
  const handleInsertLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) document.execCommand('createLink', false, url);
  };

  // Add comment
  const handleAddComment = () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString() || '';
    const id = `comment-${Date.now()}`;
    const text = window.prompt('Add comment:');
    if (!text) return;
    const newComment: Comment = {
      id,
      text,
      author: 'You',
      timestamp: new Date().toLocaleString(),
      resolved: false,
      selection: selectedText,
    };
    setComments((prev) => [...prev, newComment]);
    setShowComments(true);
    toast.success('Comment added');
  };

  // Tab switching (save current doc state)
  const handleSwitchTab = (tab: DocTab) => {
    // Save current
    setDocTabs((prev) => prev.map((t) =>
      t.id === activeDocId
        ? { ...t, content, name: documentName, fontFamily, fontSize, textColor, textAlign, headerContent, footerContent }
        : t
    ));
    // Load selected
    setContent(tab.content);
    setDocumentName(tab.name);
    setFontFamily(tab.fontFamily);
    setFontSize(tab.fontSize);
    setTextColor(tab.textColor);
    setTextAlign(tab.textAlign);
    setHeaderContent(tab.headerContent);
    setFooterContent(tab.footerContent);
    setActiveDocId(tab.id);
  };

  const handleCloseTab = (tabId: string) => {
    const remaining = docTabs.filter((t) => t.id !== tabId);
    setDocTabs(remaining);
    if (tabId === activeDocId && remaining.length > 0) {
      handleSwitchTab(remaining[remaining.length - 1]);
    }
  };

  // Theme
  const handleThemeChange = (t: Theme) => setTheme(t);

  const titleBg = {
    light: '#2b579a', dark: '#1a3a6b', classic: '#1f4e99', urdu: '#4a1942',
  }[theme];
  const ribbonBg = theme === 'dark' ? '#252526' : '#ffffff';
  const themeClass = theme === 'dark' ? 'dark' : '';

  const TABS: { id: RibbonTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'design', label: 'Design' },
    { id: 'layout', label: 'Layout' },
    { id: 'references', label: 'References' },
    { id: 'review', label: 'Review' },
    { id: 'view', label: 'View' },
    { id: 'urdu', label: 'اردو ٹولز' },
  ];

  if (!hasDocument) {
    return (
      <div className={themeClass}>
        <Toaster position="top-right" richColors />
        <WordStartScreen onNew={handleNewDocument} onLoadSample={handleLoadSample} theme={theme} onThemeChange={handleThemeChange} />
      </div>
    );
  }

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden select-none ${themeClass}`}
      style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}
      onContextMenu={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[contenteditable="true"]')) {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY, show: true });
        }
      }}
    >
      <Toaster position="top-right" richColors />

      {/* ── Title Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center h-9 px-2 gap-1 flex-shrink-0 z-50" style={{ backgroundColor: titleBg }}>
        {/* QAT + Logo */}
        <div className="flex items-center gap-1 mr-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold text-[11px] hidden md:block">لفظ نگار</span>
          </div>
          {[
            { icon: Save, action: handleSave, title: 'Save (Ctrl+S)' },
            { icon: Undo2, action: () => applyFormat('undo'), title: 'Undo (Ctrl+Z)' },
            { icon: Redo2, action: () => applyFormat('redo'), title: 'Redo (Ctrl+Y)' },
            { icon: FilePlus, action: handleNewDocument, title: 'New Document' },
            { icon: Printer, action: () => setShowPrintPreview(true), title: 'Print Preview (Ctrl+P)' },
          ].map(({ icon: Icon, action, title }) => (
            <button key={title} onClick={action} title={title}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer">
              <Icon size={13} strokeWidth={2} />
            </button>
          ))}
          <div className="w-px h-4 bg-white/20 mx-1" />
          {/* Export quick buttons */}
          <button onClick={handleExportPDF} title="Export PDF"
            className="px-1.5 py-0.5 rounded text-[9px] text-white/70 hover:bg-white/20 hover:text-white cursor-pointer border border-white/20">
            PDF
          </button>
          <button onClick={handleExportTXT} title="Export TXT"
            className="px-1.5 py-0.5 rounded text-[9px] text-white/70 hover:bg-white/20 hover:text-white cursor-pointer border border-white/20">
            TXT
          </button>
        </div>

        {/* Document name */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {isEditingName ? (
            <input
              autoFocus
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }}
              className="bg-white/20 text-white border-b border-white/50 outline-none text-center text-[12px] px-2 py-0.5 w-56"
            />
          ) : (
            <button
              onDoubleClick={() => setIsEditingName(true)}
              title="Double-click to rename"
              className="text-white text-[12px] font-medium hover:bg-white/10 px-3 py-0.5 rounded transition-colors cursor-default"
            >
              {documentName}
            </button>
          )}
          {autoSaved && (
            <span className="text-white/50 text-[10px] flex items-center gap-1">
              <Check size={10} /> Saved
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Find */}
          <button
            onClick={() => setShowFindReplace(true)}
            title="Find (Ctrl+F)"
            className="hidden md:flex items-center gap-1.5 bg-white/15 rounded px-2 py-0.5 text-white/60 hover:bg-white/20 hover:text-white cursor-pointer"
          >
            <Search size={12} />
            <span className="text-[11px]">Find</span>
          </button>
          <button onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')} title="Toggle theme"
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer">
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer" title="Account">
            <User size={13} />
          </button>
          <div className="flex items-center gap-0.5 ml-2">
            <button className="w-7 h-7 flex items-center justify-center hover:bg-white/20 text-white/70 hover:text-white rounded cursor-pointer" title="Minimize"><Minus size={13} /></button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-white/20 text-white/70 hover:text-white rounded cursor-pointer" title="Maximize"><Maximize2 size={11} /></button>
            <button className="w-7 h-7 flex items-center justify-center hover:bg-red-500 text-white/70 hover:text-white rounded cursor-pointer" title="Close"><X size={14} /></button>
          </div>
        </div>
      </div>

      {/* ── Document Tabs ──────────────────────────────────────────────────── */}
      {docTabs.length > 0 && (
        <div className="flex items-end gap-0 px-2 flex-shrink-0 overflow-x-auto" style={{ backgroundColor: titleBg }}>
          {/* Main doc */}
          <button
            onClick={() => {
              setDocTabs((prev) => prev.map((t) => t.id === activeDocId
                ? { ...t, content, name: documentName, fontFamily, fontSize, textColor, textAlign, headerContent, footerContent }
                : t
              ));
              setActiveDocId('main');
            }}
            className={[
              'flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-t-sm transition-colors cursor-pointer border-t border-l border-r border-white/20 flex-shrink-0',
              activeDocId === 'main'
                ? 'bg-white dark:bg-[#252526] text-[#2b579a] dark:text-[#6ca4d8]'
                : 'text-white/70 hover:text-white hover:bg-white/10',
            ].join(' ')}
          >
            <FileText size={11} /> {documentName}
          </button>
          {docTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSwitchTab(tab)}
              className={[
                'flex items-center gap-1.5 px-3 py-1 text-[11px] rounded-t-sm transition-colors cursor-pointer border-t border-l border-r border-white/20 flex-shrink-0 group',
                activeDocId === tab.id
                  ? 'bg-white dark:bg-[#252526] text-[#2b579a] dark:text-[#6ca4d8]'
                  : 'text-white/70 hover:text-white hover:bg-white/10',
              ].join(' ')}
            >
              <FileText size={11} />
              <span className="max-w-[100px] truncate">{tab.name}</span>
              <span
                onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                className="ml-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400 cursor-pointer"
              >
                <X size={10} />
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Ribbon ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-[#d1d1d1] dark:border-[#3a3a3a] z-40" style={{ backgroundColor: ribbonBg }}>
        <div className="flex items-end px-2 border-b border-[#d1d1d1] dark:border-[#3a3a3a]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-3 py-1.5 text-[12px] font-medium transition-colors cursor-pointer relative whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-[#2b579a] dark:text-[#6ca4d8] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2b579a] dark:after:bg-[#6ca4d8]'
                  : 'text-[#605e5c] dark:text-[#888] hover:text-[#323130] dark:hover:text-[#ccc] hover:bg-[#f3f2f1] dark:hover:bg-[#2d2d2d]',
              ].join(' ')}
              style={tab.id === 'urdu' ? { fontFamily: "'Noto Nastaliq Urdu', serif", fontSize: '13px' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-[76px] overflow-hidden">
          {activeTab === 'home' && (
            <HomeRibbon
              onBold={() => applyFormat('bold')}
              onItalic={() => applyFormat('italic')}
              onUnderline={() => applyFormat('underline')}
              onStrike={() => applyFormat('strikeThrough')}
              onSuperscript={() => applyFormat('superscript')}
              onSubscript={() => applyFormat('subscript')}
              onAlignLeft={() => setTextAlign('left')}
              onAlignCenter={() => setTextAlign('center')}
              onAlignRight={() => setTextAlign('right')}
              onAlignJustify={() => setTextAlign('justify')}
              onBullet={() => applyFormat('insertUnorderedList')}
              onNumbered={() => applyFormat('insertOrderedList')}
              onIndent={() => applyFormat('indent')}
              onOutdent={() => applyFormat('outdent')}
              onLineSpacing={setLineSpacing}
              lineSpacing={lineSpacing}
              onCut={() => applyFormat('cut')}
              onCopy={() => applyFormat('copy')}
              onPaste={() => applyFormat('paste')}
              onClearFormat={() => applyFormat('removeFormat')}
              onHighlight={(color: string) => document.execCommand('hiliteColor', false, color)}
              onFontChange={setFontFamily}
              onSizeChange={setFontSize}
              onColorChange={setTextColor}
              onHeading1={() => document.execCommand('formatBlock', false, 'h1')}
              onHeading2={() => document.execCommand('formatBlock', false, 'h2')}
              onHeading3={() => document.execCommand('formatBlock', false, 'h3')}
              onNormal={() => document.execCommand('formatBlock', false, 'p')}
              onShowWordCount={() => setShowWordCount(true)}
              fontFamily={fontFamily}
              fontSize={fontSize}
              textColor={textColor}
              availableFonts={availableFonts}
            />
          )}
          {activeTab === 'insert' && (
            <InsertRibbon
              onInsertTable={handleInsertTable}
              onInsertImage={() => toast.info('Image insertion: use a URL via the browser')}
              onInsertLink={handleInsertLink}
              onInsertPageBreak={handleInsertPageBreak}
              onInsertHR={handleInsertHR}
            />
          )}
          {activeTab === 'design' && <DesignRibbon theme={theme} onThemeChange={handleThemeChange} />}
          {activeTab === 'layout' && <LayoutRibbon onOpenPageSetup={() => setShowPageSetup(true)} />}
          {activeTab === 'references' && <ReferencesRibbon />}
          {activeTab === 'review' && (
            <ReviewRibbon
              showComments={showComments}
              onToggleComments={() => setShowComments((v) => !v)}
              onAddComment={handleAddComment}
            />
          )}
          {activeTab === 'view' && (
            <ViewRibbon
              showNav={showNav}
              onToggleNav={() => setShowNav((v) => !v)}
              showSidebar={showSidebar}
              onToggleSidebar={() => setShowSidebar((v) => !v)}
              zoom={zoom}
              onZoomChange={setZoom}
              showParaMarks={showParaMarks}
              onToggleParaMarks={() => setShowParaMarks((v) => !v)}
              onPrintPreview={() => setShowPrintPreview(true)}
            />
          )}
          {activeTab === 'urdu' && (
            <UrduRibbon
              isPhoneticMode={isPhoneticMode}
              onTogglePhonetic={() => {
                setIsPhoneticMode((v) => !v);
                toast.info(isPhoneticMode ? 'Phonetic mode off' : 'Phonetic mode on');
              }}
              onAlignRight={() => setTextAlign('right')}
              onManageFonts={() => setShowFontManager(true)}
              onShowHelp={() => setShowKeyboardGuide(true)}
              fontFamily={fontFamily}
              availableFonts={availableFonts}
              onFontChange={setFontFamily}
            />
          )}
        </div>
      </div>

      {/* ── Workspace ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Pane */}
        {showNav && (
          <div className="w-56 flex-shrink-0 border-r border-[#d1d1d1] dark:border-[#3a3a3a] flex flex-col overflow-hidden"
            style={{ backgroundColor: theme === 'dark' ? '#252526' : '#f3f2f1' }}>
            <div className="flex border-b border-[#d1d1d1] dark:border-[#3a3a3a]">
              {([
                { id: 'outline' as NavSection, icon: BookOpen, label: 'Headings' },
                { id: 'pages' as NavSection, icon: FileText, label: 'Pages' },
                { id: 'search' as NavSection, icon: ScanSearch, label: 'Search' },
              ]).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setNavSection(id)}
                  title={label}
                  className={[
                    'flex-1 py-1.5 flex items-center justify-center transition-colors cursor-pointer',
                    navSection === id
                      ? 'bg-white dark:bg-[#1e1e1e] border-b-2 border-[#2b579a] dark:border-[#6ca4d8] text-[#2b579a] dark:text-[#6ca4d8]'
                      : 'text-[#605e5c] dark:text-[#888] hover:bg-[#edebe9] dark:hover:bg-[#2d2d2d]',
                  ].join(' ')}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none' }}>
              {navSection === 'outline' && (
                <div className="space-y-0.5">
                  {content ? (
                    <>
                      {/* Extract heading-like content from document */}
                      {content.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi)?.slice(0, 10).map((h, i) => {
                        const level = parseInt(h[2]);
                        const text = h.replace(/<[^>]+>/g, '');
                        return (
                          <button key={i} className="w-full text-left py-1 rounded text-[11px] text-[#323130] dark:text-[#ccc] hover:bg-[#edebe9] dark:hover:bg-[#2d2d2d] cursor-pointer transition-colors truncate"
                            style={{ paddingLeft: `${(level - 1) * 12 + 8}px` }}>
                            <span className="text-[#605e5c] dark:text-[#888] mr-1">{'#'.repeat(level)}</span>
                            {text}
                          </button>
                        );
                      }) || (
                        <div className="text-[11px] text-[#605e5c] dark:text-[#888] text-center py-4 leading-relaxed">
                          No headings found.<br />Use H1, H2, H3 styles.
                        </div>
                      )}
                      <div className="text-[10px] text-[#605e5c] dark:text-[#888] px-2 py-1 mt-2 border-t border-[#d1d1d1] dark:border-[#3a3a3a]">
                        {pageCount} page{pageCount > 1 ? 's' : ''} · {words} words
                      </div>
                    </>
                  ) : (
                    <div className="text-[11px] text-[#605e5c] dark:text-[#888] text-center py-4 leading-relaxed">
                      Start writing to see<br />document outline
                    </div>
                  )}
                </div>
              )}
              {navSection === 'pages' && (
                <div className="space-y-3 py-2">
                  {Array.from({ length: pageCount }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-full bg-white dark:bg-[#2d2d2d] border border-[#d1d1d1] dark:border-[#444] rounded-sm shadow-sm hover:border-[#2b579a] dark:hover:border-[#6ca4d8] cursor-pointer transition-colors overflow-hidden"
                        style={{ aspectRatio: '1/1.41' }}>
                        <div className="w-full h-full flex flex-col p-1 gap-0.5 opacity-60">
                          <div className="h-0.5 bg-[#2b579a] dark:bg-[#6ca4d8] w-3/4 rounded self-end" />
                          {Array.from({ length: 8 }).map((_, j) => (
                            <div key={j} className="h-px bg-[#d1d1d1] dark:bg-[#555] rounded w-full" />
                          ))}
                        </div>
                      </div>
                      <span className="text-[9px] text-[#605e5c] dark:text-[#888]">{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
              {navSection === 'search' && (
                <div className="space-y-2">
                  <input
                    placeholder="Find in document..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setFindQuery(searchQuery); setShowFindReplace(true); } }}
                    className="w-full border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-2 py-1.5 rounded-sm outline-none focus:border-[#2b579a] placeholder-[#a0a0a0] dark:placeholder-[#666]"
                  />
                  <button
                    onClick={() => { setFindQuery(searchQuery); setShowFindReplace(true); }}
                    className="w-full py-1 text-[11px] bg-[#2b579a] text-white rounded-sm hover:bg-[#1a4480] cursor-pointer"
                  >
                    Open Find & Replace
                  </button>
                  {searchQuery && (
                    <div className="text-[10px] text-[#605e5c] dark:text-[#888]">
                      {matchCount > 0 ? `${matchCount} matches` : 'No matches'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Document Canvas ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto" style={{ backgroundColor: theme === 'dark' ? '#3c3c3c' : '#808080' }}>
          {/* Horizontal ruler */}
          <div className="sticky top-0 left-0 right-0 z-10 h-5 border-b border-[#d1d1d1] dark:border-[#555] flex items-center overflow-hidden"
            style={{ backgroundColor: theme === 'dark' ? '#252526' : '#f3f2f1' }}>
            <div className="flex items-end h-full relative w-full overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 relative" style={{ width: '20px' }}>
                  {i % 5 === 0 && (
                    <>
                      <div className="absolute bottom-0 left-0 w-px h-2.5 bg-[#605e5c] dark:bg-[#888]" />
                      {i > 0 && <span className="absolute bottom-2.5 left-0.5 text-[7px] text-[#605e5c] dark:text-[#888] leading-none">{i}</span>}
                    </>
                  )}
                  {i % 5 !== 0 && <div className="absolute bottom-0 left-0 w-px h-1.5 bg-[#d1d1d1] dark:bg-[#555]" />}
                </div>
              ))}
            </div>
          </div>

          {/* A4 page */}
          <div className="flex justify-center py-8" style={{ zoom: `${zoom}%`, minHeight: `${100 / (zoom / 100)}%` }}>
            <div
              className="bg-white shadow-2xl flex flex-col"
              style={{
                width: '794px',
                minHeight: '1123px',
                boxShadow: theme === 'dark' ? '0 4px 32px rgba(0,0,0,0.6)' : '0 4px 32px rgba(0,0,0,0.3)',
              }}
            >
              {/* Header */}
              {showHeaderFooter && (
                <div
                  className="flex-shrink-0 border-b border-dashed border-[#d1d1d1] relative group"
                  style={{ padding: '12px 80px', minHeight: '48px' }}
                >
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setHeaderContent((e.target as HTMLElement).innerHTML)}
                    dangerouslySetInnerHTML={{ __html: headerContent }}
                    className="text-[12px] text-[#605e5c] outline-none text-right"
                    style={{ direction: 'rtl', minHeight: '20px' }}
                    data-placeholder="Header..."
                  />
                  <div className="absolute top-1 left-2 text-[9px] text-[#d1d1d1] group-hover:text-[#605e5c]">Header</div>
                </div>
              )}

              {/* Main content */}
              <div
                className="flex-1 select-text"
                style={{ padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px` }}
              >
                <style>{`
                  .show-para-marks p::after { content: '¶'; color: #a0a0a0; font-size: 0.8em; margin-right: 2px; }
                  .show-para-marks br::after { content: '↵'; color: #a0a0a0; }
                  [contenteditable="true"] { outline: none; }
                  [contenteditable="true"] table { border-collapse: collapse; }
                  [contenteditable="true"] td { border: 1px solid #d1d1d1; padding: 6px 10px; min-width: 60px; }
                  [contenteditable="true"] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
                  [contenteditable="true"] h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
                  [contenteditable="true"] h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
                  [contenteditable="true"] blockquote { border-right: 4px solid #2b579a; margin-right: 0; padding-right: 16px; color: #605e5c; }
                  [contenteditable="true"] a { color: #2b579a; text-decoration: underline; }
                  [contenteditable="true"] hr { border: none; border-top: 1px solid #d1d1d1; margin: 12px 0; }
                `}</style>
                <Editor
                  content={content}
                  onChange={setContent}
                  fontSize={fontSize}
                  fontFamily={fontFamily}
                  color={textColor}
                  textAlign={textAlign}
                  isPhoneticMode={isPhoneticMode}
                />
              </div>

              {/* Footer */}
              {showHeaderFooter && (
                <div
                  className="flex-shrink-0 border-t border-dashed border-[#d1d1d1] relative group"
                  style={{ padding: '12px 80px', minHeight: '48px' }}
                >
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setFooterContent((e.target as HTMLElement).innerHTML)}
                    dangerouslySetInnerHTML={{ __html: footerContent }}
                    className="text-[12px] text-[#605e5c] outline-none text-right"
                    style={{ direction: 'rtl', minHeight: '20px' }}
                  />
                  <div className="absolute top-1 right-2 text-[9px] text-[#d1d1d1] group-hover:text-[#605e5c]">Footer</div>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-[#d1d1d1] group-hover:text-[#a0a0a0]">
                    Page 1
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ──────────────────────────────────────────────── */}
        {(showSidebar || showComments) && (
          <div className="w-60 flex-shrink-0 border-l border-[#d1d1d1] dark:border-[#3a3a3a] flex flex-col overflow-auto"
            style={{ backgroundColor: theme === 'dark' ? '#252526' : '#f3f2f1' }}>
            {/* Sidebar tabs */}
            <div className="flex border-b border-[#d1d1d1] dark:border-[#3a3a3a] flex-shrink-0">
              <button
                onClick={() => setShowComments(false)}
                className={['flex-1 py-1.5 text-[11px] cursor-pointer', !showComments ? 'font-semibold text-[#2b579a] dark:text-[#6ca4d8] border-b-2 border-[#2b579a] dark:border-[#6ca4d8]' : 'text-[#605e5c] dark:text-[#888] hover:bg-[#edebe9] dark:hover:bg-[#2d2d2d]'].join(' ')}
              >
                Properties
              </button>
              <button
                onClick={() => setShowComments(true)}
                className={['flex-1 py-1.5 text-[11px] cursor-pointer flex items-center justify-center gap-1', showComments ? 'font-semibold text-[#2b579a] dark:text-[#6ca4d8] border-b-2 border-[#2b579a] dark:border-[#6ca4d8]' : 'text-[#605e5c] dark:text-[#888] hover:bg-[#edebe9] dark:hover:bg-[#2d2d2d]'].join(' ')}
              >
                <MessageSquare size={11} /> Comments {comments.length > 0 && `(${comments.filter(c => !c.resolved).length})`}
              </button>
            </div>

            {!showComments ? (
              <div className="flex-1 overflow-auto p-3 space-y-3">
                {/* Header/Footer toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#323130] dark:text-[#ccc]">Header & Footer</span>
                  <button
                    onClick={() => setShowHeaderFooter((v) => !v)}
                    className={['px-2 py-0.5 rounded text-[10px] cursor-pointer', showHeaderFooter ? 'bg-[#c7e0f4] text-[#004578]' : 'border border-[#d1d1d1] dark:border-[#555] text-[#605e5c] dark:text-[#888] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a]'].join(' ')}
                  >
                    {showHeaderFooter ? 'On' : 'Off'}
                  </button>
                </div>

                {showHeaderFooter && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-[#605e5c] dark:text-[#888] mb-1 block">Header</label>
                      <input
                        value={headerContent.replace(/<[^>]+>/g, '')}
                        onChange={(e) => setHeaderContent(e.target.value)}
                        placeholder="Header text..."
                        className="w-full border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-2 py-1 rounded-sm outline-none focus:border-[#2b579a]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#605e5c] dark:text-[#888] mb-1 block">Footer</label>
                      <input
                        value={footerContent.replace(/<[^>]+>/g, '')}
                        onChange={(e) => setFooterContent(e.target.value)}
                        placeholder="Footer text..."
                        className="w-full border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-2 py-1 rounded-sm outline-none focus:border-[#2b579a]"
                      />
                    </div>
                  </div>
                )}

                <div className="border-t border-[#d1d1d1] dark:border-[#3a3a3a] pt-3 space-y-0.5">
                  <div className="text-[11px] font-medium text-[#323130] dark:text-[#ccc] mb-2">Font</div>
                  {[
                    { label: 'Family', value: fontFamily.replace(/'/g, '').split(',')[0] },
                    { label: 'Size', value: fontSize },
                    { label: 'Align', value: textAlign },
                    { label: 'Spacing', value: lineSpacing + '×' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-0.5">
                      <span className="text-[10px] text-[#605e5c] dark:text-[#888]">{label}</span>
                      <span className="text-[10px] text-[#323130] dark:text-[#ccc] max-w-[90px] truncate text-right">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#d1d1d1] dark:border-[#3a3a3a] pt-3 space-y-0.5">
                  <div className="text-[11px] font-medium text-[#323130] dark:text-[#ccc] mb-2">Document Stats</div>
                  {[
                    { label: 'Pages', value: String(pageCount) },
                    { label: 'Words', value: words.toLocaleString() },
                    { label: 'Characters', value: characters.toLocaleString() },
                    { label: 'Reading time', value: `${Math.ceil(words / 200)} min` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-0.5">
                      <span className="text-[10px] text-[#605e5c] dark:text-[#888]">{label}</span>
                      <span className="text-[10px] font-semibold text-[#323130] dark:text-[#ccc]">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#d1d1d1] dark:border-[#3a3a3a] pt-3 space-y-1.5">
                  <div className="text-[11px] font-medium text-[#323130] dark:text-[#ccc] mb-2">Export</div>
                  <button onClick={handleExportPDF} className="w-full text-left px-2 py-1.5 rounded text-[11px] text-[#2b579a] dark:text-[#6ca4d8] hover:bg-[#c7e0f4]/30 cursor-pointer">Export as PDF</button>
                  <button onClick={handleExportTXT} className="w-full text-left px-2 py-1.5 rounded text-[11px] text-[#2b579a] dark:text-[#6ca4d8] hover:bg-[#c7e0f4]/30 cursor-pointer">Export as TXT</button>
                  <button onClick={() => setShowWordCount(true)} className="w-full text-left px-2 py-1.5 rounded text-[11px] text-[#605e5c] dark:text-[#888] hover:bg-[#edebe9] dark:hover:bg-[#3a3a3a] cursor-pointer">Word Count Details</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Add comment */}
                <div className="p-3 border-b border-[#d1d1d1] dark:border-[#3a3a3a] flex-shrink-0">
                  <div className="flex gap-1.5">
                    <input
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCommentText.trim()) {
                          const c: Comment = {
                            id: `c-${Date.now()}`,
                            text: newCommentText,
                            author: 'You',
                            timestamp: new Date().toLocaleTimeString(),
                            resolved: false,
                          };
                          setComments((prev) => [...prev, c]);
                          setNewCommentText('');
                        }
                      }}
                      placeholder="Add comment..."
                      className="flex-1 border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[11px] px-2 py-1 rounded-sm outline-none focus:border-[#2b579a]"
                    />
                    <button
                      onClick={() => {
                        if (!newCommentText.trim()) return;
                        const c: Comment = {
                          id: `c-${Date.now()}`,
                          text: newCommentText,
                          author: 'You',
                          timestamp: new Date().toLocaleTimeString(),
                          resolved: false,
                        };
                        setComments((prev) => [...prev, c]);
                        setNewCommentText('');
                      }}
                      className="px-2 py-1 bg-[#2b579a] text-white text-[11px] rounded-sm hover:bg-[#1a4480] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Comments list */}
                <div className="flex-1 overflow-auto p-2 space-y-2">
                  {comments.length === 0 ? (
                    <div className="text-[11px] text-[#605e5c] dark:text-[#888] text-center py-6">No comments yet</div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id}
                        className={['rounded border p-2.5 text-left', comment.resolved ? 'border-[#d1d1d1] dark:border-[#444] opacity-50' : 'border-[#c7e0f4] bg-[#c7e0f4]/10 dark:border-[#264f78] dark:bg-[#264f78]/10'].join(' ')}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold text-[#2b579a] dark:text-[#6ca4d8]">{comment.author}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-[#a0a0a0]">{comment.timestamp}</span>
                            <button
                              onClick={() => setComments((prev) => prev.map((c) => c.id === comment.id ? { ...c, resolved: !c.resolved } : c))}
                              className="text-[9px] text-[#605e5c] dark:text-[#888] hover:text-[#2b579a] cursor-pointer"
                              title={comment.resolved ? 'Unresolve' : 'Resolve'}
                            >
                              <Check size={10} />
                            </button>
                            <button
                              onClick={() => setComments((prev) => prev.filter((c) => c.id !== comment.id))}
                              className="text-[9px] text-[#605e5c] dark:text-[#888] hover:text-red-500 cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                        {comment.selection && (
                          <div className="text-[10px] text-[#605e5c] dark:text-[#888] italic bg-[#f3f2f1] dark:bg-[#2d2d2d] px-1.5 py-0.5 rounded mb-1 truncate">
                            "{comment.selection}"
                          </div>
                        )}
                        <div className="text-[11px] text-[#323130] dark:text-[#ccc]">{comment.text}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Status Bar ─────────────────────────────────────────────────────── */}
      <div className="h-6 flex items-center justify-between px-3 flex-shrink-0 z-40" style={{ backgroundColor: titleBg }}>
        <div className="flex items-center gap-3 text-white/80 text-[10px]">
          <span>Page {pageCount} of {pageCount}</span>
          <span className="text-white/40">|</span>
          <button onClick={() => setShowWordCount(true)} className="hover:text-white cursor-pointer">{words.toLocaleString()} words</button>
          <span className="text-white/40">|</span>
          <span className="hidden md:inline">{characters.toLocaleString()} chars</span>
          <span className="text-white/40 hidden md:inline">|</span>
          <span className="hidden md:inline" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>اردو</span>
          <span className="text-white/40 hidden lg:inline">|</span>
          <button
            onClick={() => setIsPhoneticMode((v) => !v)}
            className={['hidden lg:inline px-1.5 py-0.5 rounded text-[9px] cursor-pointer', isPhoneticMode ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'].join(' ')}
          >
            {isPhoneticMode ? '⌨ Phonetic' : '⌨ Direct'}
          </button>
          <span className="text-white/40 hidden lg:inline">|</span>
          <button
            onClick={() => setShowHeaderFooter((v) => !v)}
            className={['hidden lg:inline text-[9px] cursor-pointer px-1 rounded', showHeaderFooter ? 'text-white' : 'text-white/50 hover:text-white'].join(' ')}
          >
            H/F
          </button>
        </div>
        <div className="flex items-center gap-2 text-white/80 text-[10px]">
          <span className="hidden sm:flex items-center gap-1">
            <SpellCheck size={11} className="text-white/60" /> Ready
          </span>
          <span className="text-white/40 hidden sm:inline">|</span>
          {/* Zoom input */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setZoom((z) => Math.max(50, z - 10))} className="text-white/60 hover:text-white cursor-pointer"><ZoomOut size={11} /></button>
            <input
              type="range"
              min={50}
              max={200}
              step={10}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 h-1 accent-white cursor-pointer"
            />
            <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="text-white/60 hover:text-white cursor-pointer"><ZoomIn size={11} /></button>
            {isEditingZoom ? (
              <input
                autoFocus
                type="number"
                value={zoomInput}
                onChange={(e) => setZoomInput(e.target.value)}
                onBlur={() => { setZoom(Math.min(200, Math.max(50, parseInt(zoomInput) || 100))); setIsEditingZoom(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { setZoom(Math.min(200, Math.max(50, parseInt(zoomInput) || 100))); setIsEditingZoom(false); } }}
                className="w-10 bg-white/20 text-white text-[10px] text-center border-b border-white/50 outline-none"
              />
            ) : (
              <button
                onClick={() => { setZoomInput(String(zoom)); setIsEditingZoom(true); }}
                className="text-white/70 hover:text-white cursor-pointer w-8 text-right"
              >
                {zoom}%
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Overlays & Dialogs ─────────────────────────────────────────────── */}

      {/* Find & Replace */}
      {showFindReplace && (
        <FindReplaceDialog
          onClose={() => setShowFindReplace(false)}
          findQuery={findQuery}
          setFindQuery={setFindQuery}
          replaceQuery={replaceQuery}
          setReplaceQuery={setReplaceQuery}
          onFindNext={handleFindNext}
          onFindPrev={handleFindPrev}
          onReplaceOne={handleReplaceOne}
          onReplaceAll={handleReplaceAll}
          matchCount={matchCount}
        />
      )}

      {/* Word Count */}
      {showWordCount && (
        <WordCountDialog
          onClose={() => setShowWordCount(false)}
          words={words}
          chars={characters}
          charsNoSpaces={charactersNoSpaces}
          content={content}
        />
      )}

      {/* Print Preview */}
      {showPrintPreview && (
        <PrintPreviewModal
          onClose={() => setShowPrintPreview(false)}
          onPrint={() => window.print()}
          content={content}
          fontFamily={fontFamily}
          fontSize={fontSize}
          textAlign={textAlign}
          headerContent={headerContent}
          footerContent={footerContent}
        />
      )}

      {/* Page Setup */}
      {showPageSetup && (
        <PageSetupDialog
          onClose={() => setShowPageSetup(false)}
          margins={margins}
          onMarginsChange={setMargins}
        />
      )}

      {/* Export */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-[#252526] rounded shadow-2xl w-80 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#d1d1d1] dark:border-[#3a3a3a]">
              <span className="text-[13px] font-semibold text-[#201f1e] dark:text-[#d4d4d4]">Export as {exportType.toUpperCase()}</span>
              <button onClick={() => setShowExportDialog(false)} className="text-[#605e5c] hover:text-[#201f1e] cursor-pointer"><X size={14} /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] text-[#605e5c] dark:text-[#888] mb-1 block">File Name</label>
                <input
                  autoFocus
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  className="w-full border border-[#d1d1d1] dark:border-[#555] bg-white dark:bg-[#2d2d2d] text-[#323130] dark:text-[#ccc] text-[12px] px-2.5 py-1.5 rounded-sm outline-none focus:border-[#2b579a]"
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowExportDialog(false)} className="px-4 py-1.5 text-[12px] text-[#323130] dark:text-[#ccc] border border-[#d1d1d1] dark:border-[#555] rounded-sm hover:bg-[#edebe9] cursor-pointer">Cancel</button>
                <button onClick={confirmExport} className="px-4 py-1.5 text-[12px] text-white bg-[#2b579a] rounded-sm hover:bg-[#1a4480] cursor-pointer">Export</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.show && (
        <ContextMenuComp
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ x: 0, y: 0, show: false })}
          onBold={() => applyFormat('bold')}
          onItalic={() => applyFormat('italic')}
          onUnderline={() => applyFormat('underline')}
          onCopy={() => applyFormat('copy')}
          onCut={() => applyFormat('cut')}
          onPaste={() => applyFormat('paste')}
          onSelectAll={() => applyFormat('selectAll')}
          onAddComment={handleAddComment}
        />
      )}

      {/* Keyboard Guide */}
      <KeyboardGuide open={showKeyboardGuide} onClose={() => setShowKeyboardGuide(false)} />
      <FontImportDialog
        open={showFontManager}
        onClose={() => setShowFontManager(false)}
        customFonts={availableFonts.filter((f) => f.source === 'custom')}
        onFontImported={handleFontImported}
        onFontDeleted={handleFontDeleted}
      />
      <ListStyleDialog
        open={showListStyleDialog}
        onClose={() => setShowListStyleDialog(false)}
        listType={currentListType}
        onApply={(style: string) => {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0) return;
          let node = sel.anchorNode;
          while (node && node !== document.body) {
            if (node instanceof HTMLElement && (node.tagName === 'UL' || node.tagName === 'OL')) {
              node.style.listStyleType = style;
              break;
            }
            node = node.parentNode;
          }
        }}
      />
    </div>
  );
}
