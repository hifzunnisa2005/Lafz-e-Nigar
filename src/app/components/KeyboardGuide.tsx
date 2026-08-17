import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import { X } from 'lucide-react';

interface KeyboardGuideProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardGuide({ open, onClose }: KeyboardGuideProps) {
  const mappings = [
    // Vowels
    { category: 'Vowels', items: [
      ['a', 'ا'], ['A', 'آ'], ['i', 'ی'], ['I', 'ئ'],
      ['u', 'و'], ['U', 'ؤ'], ['e', 'ے'], ['E', 'ۓ'],
    ]},
    // Common Consonants
    { category: 'Common Consonants', items: [
      ['b', 'ب'], ['p', 'پ'], ['t', 'ت'], ['T', 'ٹ'],
      ['j', 'ج'], ['c', 'چ'], ['h', 'ح'], ['H', 'ھ'],
      ['d', 'د'], ['D', 'ڈ'], ['r', 'ر'], ['R', 'ڑ'],
      ['z', 'ز'], ['s', 'س'], ['S', 'ش'], ['f', 'ف'],
      ['q', 'ق'], ['k', 'ک'], ['g', 'گ'], ['l', 'ل'],
      ['m', 'م'], ['n', 'ن'], ['N', 'ں'], ['w', 'و'],
      ['y', 'ی'], ['Y', 'ے'],
    ]},
    // Two-letter Combinations
    { category: 'Two-letter Combinations', items: [
      ['kh', 'خ'], ['gh', 'غ'], ['ch', 'چ'], ['sh', 'ش'],
      ['th', 'ث'], ['dh', 'ذ'], ['zh', 'ژ'],
    ]},
    // Numbers
    { category: 'Numbers', items: [
      ['0', '۰'], ['1', '۱'], ['2', '۲'], ['3', '۳'], ['4', '۴'],
      ['5', '۵'], ['6', '۶'], ['7', '۷'], ['8', '۸'], ['9', '۹'],
    ]},
    // Punctuation
    { category: 'Punctuation', items: [
      [',', '،'], [';', '؛'], ['?', '؟'], ['.', '۔'],
    ]},
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span>Phonetic Keyboard Guide</span>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent>
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Type Roman letters to get Urdu characters automatically. The mapping follows
            phonetic pronunciation for easy typing.
          </p>

          {mappings.map((section) => (
            <div key={section.category}>
              <h3 className="font-semibold text-gray-900 mb-3 text-base">
                {section.category}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {section.items.map(([roman, urdu]) => (
                  <div
                    key={roman}
                    className="flex items-center justify-between bg-gray-50 rounded p-2 border border-gray-200"
                  >
                    <span className="text-sm font-mono text-gray-700">{roman}</span>
                    <span className="mx-2 text-gray-400">→</span>
                    <span
                      className="text-lg"
                      style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}
                    >
                      {urdu}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-blue-900 mb-2">Phonetic Typing Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Type multi-character sequences like "kh", "gh", "sh" for special letters</li>
              <li>Use capital letters for aspirated and special forms (T → ٹ, D → ڈ, R → ڑ)</li>
              <li>Toggle phonetic mode ON/OFF using the keyboard button in the toolbar</li>
              <li>When phonetic mode is OFF, you can type Urdu directly if you have an Urdu keyboard</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-green-900 mb-2">Formatting Shortcuts:</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li><strong>Ctrl + B</strong> - Bold text</li>
              <li><strong>Ctrl + I</strong> - Italic text</li>
              <li><strong>Ctrl + U</strong> - Underline text</li>
              <li><strong>Tab</strong> - Increase indent (in lists)</li>
              <li><strong>Shift + Tab</strong> - Decrease indent (in lists)</li>
              <li><strong>Enter (twice)</strong> - Exit list</li>
              <li><strong>Shift + Enter</strong> - New line without bullet/number</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
