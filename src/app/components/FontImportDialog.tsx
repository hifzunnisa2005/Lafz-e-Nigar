import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
} from '@mui/material';
import { Upload, Trash2, X } from 'lucide-react';
import { Font, loadCustomFont } from '../utils/fontManager';

interface FontImportDialogProps {
  open: boolean;
  onClose: () => void;
  customFonts: Font[];
  onFontImported: (font: Font) => void;
  onFontDeleted: (fontFamily: string) => void;
}

export default function FontImportDialog({
  open,
  onClose,
  customFonts,
  onFontImported,
  onFontDeleted,
}: FontImportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileExtension = file.name.toLowerCase().match(/\.(ttf|otf|woff|woff2)$/);

    if (!fileExtension) {
      setError('Invalid file type. Please upload a .ttf, .otf, .woff, or .woff2 font file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const font = await loadCustomFont(file);
      onFontImported(font);
      setError(null);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Failed to load font. Please ensure it is a valid font file.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = (fontFamily: string) => {
    if (window.confirm('Are you sure you want to delete this custom font?')) {
      onFontDeleted(fontFamily);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>Manage Custom Fonts</span>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent>
        <div className="space-y-4">
          <div>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Upload size={18} />}
              onClick={handleUploadClick}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Importing...' : 'Import Font File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: .ttf, .otf, .woff, .woff2
            </p>
          </div>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {customFonts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Your Custom Fonts ({customFonts.length})
              </h4>
              <List className="border border-gray-200 rounded">
                {customFonts.map((font) => (
                  <ListItem
                    key={font.family}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete(font.family)}
                        size="small"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={font.name}
                      primaryTypographyProps={{
                        style: { fontFamily: font.family },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </div>
          )}

          {customFonts.length === 0 && !error && (
            <div className="text-center py-8 text-gray-500">
              <Upload size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No custom fonts imported yet.</p>
              <p className="text-xs">Upload your favorite Urdu fonts to use them in your documents.</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Tips:</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Use high-quality Urdu Nastaliq fonts for best results</li>
              <li>Custom fonts are saved in your browser</li>
              <li>Recommended: Jameel Noori, Pak Nastaleeq, Alvi Nastaleeq</li>
            </ul>
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
