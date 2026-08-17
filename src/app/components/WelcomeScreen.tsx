import { FileText, Keyboard, Download, Sparkles, List } from 'lucide-react';
import { Button } from '@mui/material';

interface WelcomeScreenProps {
  onNewDocument: () => void;
  onLoadSample?: () => void;
}

export default function WelcomeScreen({ onNewDocument, onLoadSample }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-6 sm:p-12 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-600 text-white mb-4">
            <FileText size={40} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
            لفظ نگار
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Lafz-Nigar</h2>
          <p className="text-gray-600">Professional Urdu Word Processor</p>
        </div>

        <div className="mb-8 flex gap-4 justify-center flex-wrap">
          <Button
            variant="contained"
            size="large"
            onClick={onNewDocument}
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': { backgroundColor: '#1d4ed8' },
              paddingX: 4,
              paddingY: 1.5,
              fontSize: '1.1rem',
            }}
            startIcon={<FileText />}
          >
            Create New Document
          </Button>
          {onLoadSample && (
            <Button
              variant="outlined"
              size="large"
              onClick={onLoadSample}
              sx={{
                borderColor: '#2563eb',
                color: '#2563eb',
                '&:hover': { borderColor: '#1d4ed8', backgroundColor: 'rgba(37, 99, 235, 0.04)' },
                paddingX: 4,
                paddingY: 1.5,
                fontSize: '1.1rem',
              }}
              startIcon={<Sparkles />}
            >
              Load Sample
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="p-6 bg-blue-50 rounded-xl">
            <div className="flex justify-center mb-3">
              <Keyboard size={32} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Phonetic Typing</h3>
            <p className="text-sm text-gray-600">
              Type in Roman letters and get Urdu text automatically (A → ا, B → ب)
            </p>
          </div>

          <div className="p-6 bg-indigo-50 rounded-xl">
            <div className="flex justify-center mb-3">
              <Sparkles size={32} className="text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Beautiful Nastaliq</h3>
            <p className="text-sm text-gray-600">
              Perfect Nastaliq rendering with RTL support and proper text flow
            </p>
          </div>

          <div className="p-6 bg-green-50 rounded-xl">
            <div className="flex justify-center mb-3">
              <List size={32} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Lists & Formatting</h3>
            <p className="text-sm text-gray-600">
              Create bullet points and numbered lists with full RTL support
            </p>
          </div>

          <div className="p-6 bg-purple-50 rounded-xl">
            <div className="flex justify-center mb-3">
              <Download size={32} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Export Ready</h3>
            <p className="text-sm text-gray-600">
              Export your documents to PDF or TXT with perfect formatting
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Professional Urdu word processing made simple and powerful
          </p>
        </div>
      </div>
    </div>
  );
}
