/**
 * Font Manager for Urdu Word Processor
 *
 * This module manages font selection and custom font imports.
 *
 * Features:
 * - Multiple pre-installed Urdu fonts (Noto Nastaliq Urdu, Amiri, etc.)
 * - Import custom fonts (.ttf, .otf, .woff, .woff2)
 * - Save custom fonts to localStorage for persistence
 * - Delete custom fonts
 *
 * Usage:
 * 1. Click the Upload icon in the toolbar
 * 2. Click "Import Font File" and select your font file
 * 3. The font will be available in the Font dropdown
 * 4. Custom fonts are marked with a star (⭐)
 *
 * Recommended Urdu Fonts:
 * - Jameel Noori Nastaleeq
 * - Pak Nastaleeq
 * - Alvi Nastaleeq
 * - Nafees Nastaleeq
 */

export interface Font {
  name: string;
  family: string;
  source: 'google' | 'custom';
  url?: string;
}

export const DEFAULT_FONTS: Font[] = [
  {
    name: 'Noto Nastaliq Urdu',
    family: "'Noto Nastaliq Urdu', serif",
    source: 'google',
  },
  {
    name: 'Noto Sans Arabic',
    family: "'Noto Sans Arabic', sans-serif",
    source: 'google',
  },
  {
    name: 'Amiri',
    family: "'Amiri', serif",
    source: 'google',
  },
  {
    name: 'Scheherazade New',
    family: "'Scheherazade New', serif",
    source: 'google',
  },
  {
    name: 'Lateef',
    family: "'Lateef', serif",
    source: 'google',
  },
];

export function loadCustomFont(fontFile: File): Promise<Font> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const fontData = e.target?.result;
        if (!fontData) {
          reject(new Error('Failed to read font file'));
          return;
        }

        const fontName = fontFile.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
        const fontFamily = `custom-${fontName.replace(/\s+/g, '-')}`;

        // Create a new FontFace
        const fontFace = new FontFace(fontFamily, fontData as ArrayBuffer);

        // Load the font
        await fontFace.load();

        // Add to document fonts
        document.fonts.add(fontFace);

        const customFont: Font = {
          name: fontName,
          family: `'${fontFamily}', serif`,
          source: 'custom',
          url: fontData as string,
        };

        resolve(customFont);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read font file'));
    };

    reader.readAsArrayBuffer(fontFile);
  });
}

export function saveCustomFonts(fonts: Font[]): void {
  try {
    const customFonts = fonts.filter(f => f.source === 'custom');
    localStorage.setItem('urdu-custom-fonts', JSON.stringify(customFonts));
  } catch (error) {
    console.error('Error saving custom fonts:', error);
  }
}

export function loadSavedCustomFonts(): Font[] {
  try {
    const saved = localStorage.getItem('urdu-custom-fonts');
    if (saved) {
      const fonts: Font[] = JSON.parse(saved);

      // Re-register custom fonts
      fonts.forEach(async (font) => {
        if (font.url) {
          try {
            const fontFamily = font.family.replace(/['"]/g, '').split(',')[0];
            const fontFace = new FontFace(fontFamily, `url(${font.url})`);
            await fontFace.load();
            document.fonts.add(fontFace);
          } catch (error) {
            console.error(`Error loading custom font ${font.name}:`, error);
          }
        }
      });

      return fonts;
    }
  } catch (error) {
    console.error('Error loading custom fonts:', error);
  }
  return [];
}

export function deleteCustomFont(fontFamily: string, allFonts: Font[]): Font[] {
  const updatedFonts = allFonts.filter(f => f.family !== fontFamily);
  saveCustomFonts(updatedFonts);
  return updatedFonts;
}
