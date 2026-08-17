import { useRef, useEffect, KeyboardEvent } from 'react';
import { urduSequences, urduPhoneticMap } from '../utils/urduKeyboard';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  fontSize: string;
  fontFamily: string;
  color: string;
  textAlign: string;
  isPhoneticMode: boolean;
}

export default function Editor({
  content,
  onChange,
  fontSize,
  fontFamily,
  color,
  textAlign,
  isPhoneticMode,
}: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const bufferRef = useRef<string>('');

  // Initialize editor with content on mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.textContent) {
      editorRef.current.textContent = content || '';
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && editorRef.current.textContent !== content) {
      const selection = window.getSelection();
      let startOffset = 0;

      // Safely get current cursor position
      try {
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          startOffset = range.startOffset;
        }
      } catch (e) {
        // Ignore selection errors
        startOffset = 0;
      }

      editorRef.current.textContent = content || '';

      // Restore cursor position
      try {
        if (selection && editorRef.current.firstChild) {
          const newRange = document.createRange();
          const textNode = editorRef.current.firstChild;
          const offset = Math.min(startOffset, textNode.textContent?.length || 0);
          newRange.setStart(textNode, offset);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } catch (e) {
        // Ignore cursor restoration errors
      }
    }
  }, [content]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isPhoneticMode) {
      bufferRef.current = '';
      return;
    }

    const key = e.key;

    // Skip special keys
    if (
      key === 'Backspace' ||
      key === 'Delete' ||
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Tab' ||
      key === 'Enter' ||
      key === 'Escape' ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    ) {
      if (key === 'Backspace' && bufferRef.current.length > 0) {
        bufferRef.current = bufferRef.current.slice(0, -1);
      } else if (key === ' ' || key === 'Enter') {
        bufferRef.current = '';
      }
      return;
    }

    // Build buffer for multi-character sequences
    bufferRef.current += key;

    // Check for multi-character sequences
    for (const [latin, urdu] of urduSequences) {
      if (bufferRef.current.endsWith(latin)) {
        e.preventDefault();

        try {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;

          const range = selection.getRangeAt(0);

          if (range && editorRef.current) {
            // Remove the latin characters
            const currentText = editorRef.current.textContent || '';
            const cursorPos = range.startOffset;
            const beforeCursor = currentText.substring(0, cursorPos);
            const afterCursor = currentText.substring(cursorPos);

            // Remove the sequence and insert Urdu character
            const newBefore = beforeCursor.slice(0, -latin.length) + urdu;
            const newText = newBefore + afterCursor;

            editorRef.current.textContent = newText;
            onChange(newText);

            // Set cursor position after the inserted character
            const textNode = editorRef.current.firstChild;
            if (textNode) {
              const newRange = document.createRange();
              newRange.setStart(textNode, newBefore.length);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        } catch (err) {
          console.error('Selection error:', err);
        }

        bufferRef.current = '';
        return;
      }
    }

    // Check for single character mapping
    const urduChar = urduPhoneticMap[key];
    if (urduChar && key.length === 1) {
      e.preventDefault();

      try {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          // If no selection, just append to the end
          if (editorRef.current) {
            const currentText = editorRef.current.textContent || '';
            const newText = currentText + urduChar;
            editorRef.current.textContent = newText;
            onChange(newText);
          }
          return;
        }

        const range = selection.getRangeAt(0);

        if (range && editorRef.current) {
          const currentText = editorRef.current.textContent || '';
          const cursorPos = range.startOffset;
          const beforeCursor = currentText.substring(0, cursorPos);
          const afterCursor = currentText.substring(cursorPos);

          const newText = beforeCursor + urduChar + afterCursor;
          editorRef.current.textContent = newText;
          onChange(newText);

          // Set cursor position after the inserted character
          const textNode = editorRef.current.firstChild;
          if (textNode) {
            const newRange = document.createRange();
            newRange.setStart(textNode, beforeCursor.length + urduChar.length);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      } catch (err) {
        console.error('Selection error:', err);
      }

      // Reset buffer after a successful single character conversion
      if (bufferRef.current.length > 3) {
        bufferRef.current = key;
      }
    }

    // Limit buffer size
    if (bufferRef.current.length > 10) {
      bufferRef.current = bufferRef.current.slice(-5);
    }
  };

  const handleInput = () => {
    if (!isPhoneticMode && editorRef.current) {
      onChange(editorRef.current.textContent || '');
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white p-8">
      <div
        ref={editorRef}
        contentEditable
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        className="min-h-full outline-none"
        style={{
          fontFamily: fontFamily,
          fontSize: fontSize,
          color: color,
          textAlign: textAlign as any,
          direction: 'rtl',
          lineHeight: '2',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
        suppressContentEditableWarning
      >
        {!content && ''}
      </div>
    </div>
  );
}
