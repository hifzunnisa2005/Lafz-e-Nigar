// Phonetic Urdu Keyboard Mapping
export const urduPhoneticMap: Record<string, string> = {
  // Vowels
  'a': 'ا',
  'A': 'آ',
  'i': 'ی',
  'I': 'ئ',
  'u': 'و',
  'U': 'ؤ',
  'e': 'ے',
  'E': 'ۓ',
  'o': 'و',
  'O': 'ہو',

  // Consonants
  'b': 'ب',
  'B': 'ﺏ',
  'p': 'پ',
  'P': 'ﭖ',
  't': 'ت',
  'T': 'ٹ',
  'th': 'ث',
  'j': 'ج',
  'J': 'ژ',
  'c': 'چ',
  'C': 'چھ',
  'h': 'ح',
  'H': 'ھ',
  'kh': 'خ',
  'd': 'د',
  'D': 'ڈ',
  'dh': 'ذ',
  'r': 'ر',
  'R': 'ڑ',
  'z': 'ز',
  'Z': 'ض',
  'x': 'ژ',
  's': 'س',
  'S': 'ش',
  'sw': 'ص',
  'zw': 'ظ',
  'f': 'ف',
  'q': 'ق',
  'Q': 'ق',
  'k': 'ک',
  'K': 'ک',
  'g': 'گ',
  'G': 'غ',
  'l': 'ل',
  'L': 'ل',
  'm': 'م',
  'M': 'م',
  'n': 'ن',
  'N': 'ں',
  'v': 'و',
  'w': 'و',
  'W': 'ؤ',
  'y': 'ی',
  'Y': 'ے',

  // Special characters and diacritics
  '~': 'ّ', // Tashdeed
  '^': 'ٰ', // Alif khari
  '_': 'ٔ', // Hamza

  // Numbers
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹',

  // Punctuation
  ',': '،',
  ';': '؛',
  '?': '؟',
  '.': '۔',
};

// Multi-character sequences (process these first)
export const urduSequences: Array<[string, string]> = [
  ['kh', 'خ'],
  ['gh', 'غ'],
  ['ch', 'چ'],
  ['sh', 'ش'],
  ['th', 'ث'],
  ['dh', 'ذ'],
  ['zh', 'ژ'],
  ['sw', 'ص'],
  ['zw', 'ظ'],
  ['Ch', 'چھ'],
  ['CH', 'چھ'],
  ['Gh', 'غ'],
  ['GH', 'غ'],
  ['Kh', 'خ'],
  ['KH', 'خ'],
  ['Sh', 'ش'],
  ['SH', 'ش'],
  ['Th', 'ث'],
  ['TH', 'ث'],
];

export function convertToUrdu(text: string, isPhoneticMode: boolean): string {
  if (!isPhoneticMode) return text;

  let result = text;

  // Process multi-character sequences first
  urduSequences.forEach(([latin, urdu]) => {
    result = result.replaceAll(latin, urdu);
  });

  // Process single characters
  for (const [latin, urdu] of Object.entries(urduPhoneticMap)) {
    if (latin.length === 1) {
      result = result.replaceAll(latin, urdu);
    }
  }

  return result;
}

export function getUrduChar(key: string, isPhoneticMode: boolean): string | null {
  if (!isPhoneticMode) return null;
  return urduPhoneticMap[key] || null;
}
