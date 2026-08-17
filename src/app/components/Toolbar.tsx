import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Download,
  FileText,
  Folder,
  Keyboard,
  Type,
  HelpCircle,
  Upload,
  List,
  ListOrdered,
  Indent,
  Outdent,
} from 'lucide-react';
import { Button } from '@mui/material';
import { Tooltip } from '@mui/material';
import { Font } from '../utils/fontManager';

interface ToolbarProps {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onFontSizeChange: (size: string) => void;
  onFontChange: (fontFamily: string) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onExportPDF: () => void;
  onExportTXT: () => void;
  onNewDocument: () => void;
  onManageFonts: () => void;
  isPhoneticMode: boolean;
  onTogglePhonetic: () => void;
  onShowHelp: () => void;
  currentAlign: string;
  currentFontSize: string;
  currentFont: string;
  availableFonts: Font[];
}

export default function Toolbar({
  onBold,
  onItalic,
  onUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onBulletList,
  onNumberedList,
  onIndent,
  onOutdent,
  onFontSizeChange,
  onFontChange,
  onColorChange,
  onSave,
  onExportPDF,
  onExportTXT,
  onNewDocument,
  onManageFonts,
  isPhoneticMode,
  onTogglePhonetic,
  onShowHelp,
  currentAlign,
  currentFontSize,
  currentFont,
  availableFonts,
}: ToolbarProps) {
  const fontSizes = ['4px','5px','6px','7px','8px','10px','12px','14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px','72px'];
  const colors = ['#000000', '#1e40af', '#dc2626', '#059669', '#7c3aed', '#ea580c'];

  return (
    <div className="border-b border-gray-200 bg-white p-3 flex flex-wrap gap-2 items-center shadow-sm">
      {/* File Operations */}
      <div className="flex gap-1 border-r border-gray-200 pr-2">
        <Tooltip title="New Document">
          <Button
            onClick={onNewDocument}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <FileText size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Save">
          <Button
            onClick={onSave}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Save size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Export as PDF">
          <Button
            onClick={onExportPDF}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Download size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Export as TXT">
          <Button
            onClick={onExportTXT}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Folder size={18} />
          </Button>
        </Tooltip>
      </div>

      {/* Formatting */}
      <div className="flex gap-1 border-r border-gray-200 pr-2">
        <Tooltip title="Bold">
          <Button
            onClick={onBold}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Bold size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Italic">
          <Button
            onClick={onItalic}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Italic size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Underline">
          <Button
            onClick={onUnderline}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Underline size={18} />
          </Button>
        </Tooltip>
      </div>

      {/* Alignment */}
      <div className="flex gap-1 border-r border-gray-200 pr-2">
        <Tooltip title="Align Left">
          <Button
            onClick={onAlignLeft}
            size="small"
            variant={currentAlign === 'left' ? 'contained' : 'text'}
            sx={{ minWidth: '40px', color: currentAlign === 'left' ? '#fff' : '#1e293b' }}
          >
            <AlignLeft size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Align Center">
          <Button
            onClick={onAlignCenter}
            size="small"
            variant={currentAlign === 'center' ? 'contained' : 'text'}
            sx={{ minWidth: '40px', color: currentAlign === 'center' ? '#fff' : '#1e293b' }}
          >
            <AlignCenter size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Align Right">
          <Button
            onClick={onAlignRight}
            size="small"
            variant={currentAlign === 'right' ? 'contained' : 'text'}
            sx={{ minWidth: '40px', color: currentAlign === 'right' ? '#fff' : '#1e293b' }}
          >
            <AlignRight size={18} />
          </Button>
        </Tooltip>
      </div>

      {/* Lists */}
      <div className="flex gap-1 border-r border-gray-200 pr-2">
        <Tooltip title="Bullet List">
          <Button
            onClick={onBulletList}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <List size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Numbered List">
          <Button
            onClick={onNumberedList}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <ListOrdered size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Increase Indent">
          <Button
            onClick={onIndent}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Indent size={18} />
          </Button>
        </Tooltip>
        <Tooltip title="Decrease Indent">
          <Button
            onClick={onOutdent}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <Outdent size={18} />
          </Button>
        </Tooltip>
      </div>

      {/* Font Family */}
      <div className="flex gap-1 items-center border-r border-gray-200 pr-2">
        <span className="text-sm text-gray-600 hidden lg:inline">Font:</span>
        <select
          value={currentFont}
          onChange={(e) => onFontChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px] max-w-[180px]"
          style={{ fontFamily: currentFont }}
        >
          {availableFonts.map((font) => (
            <option key={font.family} value={font.family} style={{ fontFamily: font.family }}>
              {font.name} {font.source === 'custom' ? '⭐' : ''}
            </option>
          ))}
        </select>
        <Tooltip title="Import Custom Fonts">
          <Button
            onClick={onManageFonts}
            size="small"
            variant="text"
            sx={{ minWidth: '32px', color: '#1e293b', padding: '4px 8px' }}
          >
            <Upload size={16} />
          </Button>
        </Tooltip>
      </div>

      {/* Font Size */}
      <div className="flex gap-2 items-center border-r border-gray-200 pr-2">
        <Type size={16} className="text-gray-600" />
        <select
          value={currentFontSize}
          onChange={(e) => onFontSizeChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {fontSizes.map((size) => (
            <option key={size} value={size}>
              {parseInt(size)}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div className="flex gap-2 items-center border-r border-gray-200 pr-2">
        <span className="text-sm text-gray-600">Color:</span>
        <div className="flex gap-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Phonetic Mode Toggle */}
      <div className="flex gap-2 items-center ml-auto">
        <Tooltip title="Keyboard Guide">
          <Button
            onClick={onShowHelp}
            size="small"
            variant="text"
            sx={{ minWidth: '40px', color: '#1e293b' }}
          >
            <HelpCircle size={18} />
          </Button>
        </Tooltip>
        <Tooltip title={isPhoneticMode ? 'Switch English' : 'Switch Urdu'}>
          <Button
            onClick={onTogglePhonetic}
            size="small"
            variant={isPhoneticMode ? 'contained' : 'outlined'}
            color={isPhoneticMode ? 'primary' : 'inherit'}
            startIcon={<Keyboard size={18} />}
          >
            {isPhoneticMode ? 'English' : 'Urdu'}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
