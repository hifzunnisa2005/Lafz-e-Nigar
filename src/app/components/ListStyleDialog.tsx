import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { X } from 'lucide-react';

interface ListStyleDialogProps {
  open: boolean;
  onClose: () => void;
  listType: 'bullet' | 'numbered';
  onApply: (style: string) => void;
}

export default function ListStyleDialog({
  open,
  onClose,
  listType,
  onApply,
}: ListStyleDialogProps) {
  const bulletStyles = [
    { value: 'disc', label: '● Disc (Default)', example: '●' },
    { value: 'circle', label: '○ Circle', example: '○' },
    { value: 'square', label: '■ Square', example: '■' },
    { value: 'arabic', label: '• Arabic Bullet', example: '•' },
  ];

  const numberStyles = [
    { value: 'decimal', label: '1. Numbers (1, 2, 3)', example: '1.' },
    { value: 'decimal-leading-zero', label: '01. Zero-padded (01, 02, 03)', example: '01.' },
    { value: 'lower-alpha', label: 'a. Lowercase (a, b, c)', example: 'a.' },
    { value: 'upper-alpha', label: 'A. Uppercase (A, B, C)', example: 'A.' },
    { value: 'lower-roman', label: 'i. Roman Lower (i, ii, iii)', example: 'i.' },
    { value: 'upper-roman', label: 'I. Roman Upper (I, II, III)', example: 'I.' },
    { value: 'arabic-indic', label: '١. Arabic-Indic (١, ٢, ٣)', example: '١.' },
  ];

  const styles = listType === 'bullet' ? bulletStyles : numberStyles;
  const [selectedStyle, setSelectedStyle] = useState(styles[0].value);

  const handleApply = () => {
    onApply(selectedStyle);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>{listType === 'bullet' ? 'Bullet List Style' : 'Numbered List Style'}</span>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent>
        <RadioGroup
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
        >
          {styles.map((style) => (
            <FormControlLabel
              key={style.value}
              value={style.value}
              control={<Radio />}
              label={
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold" style={{ minWidth: '30px' }}>
                    {style.example}
                  </span>
                  <span>{style.label}</span>
                </div>
              }
            />
          ))}
        </RadioGroup>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="text-sm font-semibold text-blue-900 mb-1">Preview:</h4>
          <ul
            className="text-sm text-blue-800"
            style={{
              listStyleType: listType === 'bullet' ? selectedStyle : 'none',
              direction: 'rtl',
              paddingRight: '30px',
            }}
          >
            {listType === 'bullet' ? (
              <>
                <li>پہلی شے</li>
                <li>دوسری شے</li>
                <li>تیسری شے</li>
              </>
            ) : (
              <ol style={{ listStyleType: selectedStyle, paddingRight: '30px' }}>
                <li>پہلی شے</li>
                <li>دوسری شے</li>
                <li>تیسری شے</li>
              </ol>
            )}
          </ul>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained" color="primary">
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
