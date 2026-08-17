import { FileText, Type, Hash } from 'lucide-react';

interface StatusBarProps {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  documentName: string;
}

export default function StatusBar({
  words,
  characters,
  charactersNoSpaces,
  documentName,
}: StatusBarProps) {
  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between text-sm flex-wrap gap-2">
      <div className="flex items-center gap-2 text-gray-700">
        <FileText size={14} />
        <span className="font-medium truncate max-w-xs">{documentName}</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 text-gray-600 text-xs sm:text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <Type size={14} />
          <span>Words: <strong className="text-gray-900">{words}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <Hash size={14} />
          <span className="hidden sm:inline">Characters: </span>
          <span className="sm:hidden">Chars: </span>
          <strong className="text-gray-900">{characters}</strong>
        </div>

        <div className="flex items-center gap-2 hidden md:flex">
          <Hash size={14} />
          <span>
            Characters (no spaces): <strong className="text-gray-900">{charactersNoSpaces}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
