import { useEffect, useRef } from 'react';

interface UseBarcodeScannerProps {
  onScan: (barcode: string) => void;
  minDelay?: number;
}

export function useBarcodeScanner({ onScan, minDelay = 30 }: UseBarcodeScannerProps) {
  const buffer = useRef<string>('');
  const lastKeyTime = useRef<number>(Date.now());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      if (e.key === 'Enter') {
        if (buffer.current.length > 0) {
          // If the time difference between first and last key is very small, it's likely a scanner
          onScan(buffer.current);
          buffer.current = '';
        }
      } else if (e.key.length === 1) {
        // Only append single character keys
        if (timeDiff > minDelay) {
          // If too much time has passed, it's a slow human typer, reset buffer
          buffer.current = e.key;
        } else {
          // Fast typing (scanner)
          buffer.current += e.key;
        }
      }
      lastKeyTime.current = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, minDelay]);
}
