import React from 'react';
import { HEBREW_KEYBOARD_ROWS } from '../utils/hebrewKeyboard';
import { Delete, Lightbulb } from 'lucide-react';
import { sounds } from '../utils/audio';
import { Language } from '../types/game';

interface VirtualKeyboardProps {
  onLetterPress: (letter: string) => void;
  onBackspace: () => void;
  onHintClick?: () => void;
  canHint?: boolean;
  disabled?: boolean;
  language?: Language;
}

const ENGLISH_KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onLetterPress,
  onBackspace,
  onHintClick,
  canHint = true,
  disabled = false,
  language = 'he',
}) => {
  const isEn = language === 'en';

  const handleKey = (letter: string) => {
    if (disabled) return;
    sounds.soundKeypress();
    onLetterPress(letter);
  };

  const handleDelete = () => {
    if (disabled) return;
    sounds.soundDelete();
    onBackspace();
  };

  const handleHint = () => {
    if (disabled || !canHint || !onHintClick) return;
    sounds.soundKeypress();
    onHintClick();
  };

  // Uniform key styling across all rows: identical width, height, and touch handling
  const keyBaseClass =
    'flex-1 min-w-0 max-w-[40px] sm:max-w-[46px] h-11 sm:h-12 flex items-center justify-center rounded-xl text-base sm:text-xl font-black touch-manipulation cursor-pointer select-none transition-all active:scale-95 shadow-sm';

  return (
    <div className="w-full max-w-lg mx-auto mt-2 px-1 select-none" dir={isEn ? 'ltr' : 'rtl'}>
      {!isEn ? (
        /* Hebrew Uniform 10-Column Keyboard */
        <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
          {/* Row 0: Hint (or spacer) + 8 Letters + Spacer (10 equal columns) */}
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 w-full">
            {onHintClick ? (
              <button
                type="button"
                onClick={handleHint}
                disabled={!canHint || disabled}
                title="קבל רמז"
                className={`btn-3d ${keyBaseClass} flex-col ${
                  canHint && !disabled
                    ? 'btn-3d-dark text-amber-300 border-amber-500/40 shadow-[0_3px_0_#78350f]'
                    : 'bg-white/5 text-slate-500 border border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-black leading-none mt-0.5">רמז</span>
              </button>
            ) : (
              <div className="flex-1 min-w-0 max-w-[40px] sm:max-w-[46px] h-11 sm:h-12 pointer-events-none opacity-0 select-none" aria-hidden="true" />
            )}

            {HEBREW_KEYBOARD_ROWS[0].map((char) => (
              <button
                key={char}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(char)}
                className={`btn-3d btn-3d-dark text-white active:bg-pink-500/40 ${keyBaseClass}`}
              >
                {char}
              </button>
            ))}

            {/* Spacer key to keep the row at exactly 10 equal columns */}
            <div className="flex-1 min-w-0 max-w-[40px] sm:max-w-[46px] h-11 sm:h-12 pointer-events-none opacity-0 select-none" aria-hidden="true" />
          </div>

          {/* Row 1: 10 Letters (10 equal columns) */}
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 w-full">
            {HEBREW_KEYBOARD_ROWS[1].map((char) => (
              <button
                key={char}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(char)}
                className={`btn-3d btn-3d-dark text-white active:bg-pink-500/40 ${keyBaseClass}`}
              >
                {char}
              </button>
            ))}
          </div>

          {/* Row 2: 9 Letters + Backspace (10 equal columns) */}
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 w-full">
            {HEBREW_KEYBOARD_ROWS[2].map((char) => (
              <button
                key={char}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(char)}
                className={`btn-3d btn-3d-dark text-white active:bg-pink-500/40 ${keyBaseClass}`}
              >
                {char}
              </button>
            ))}

            <button
              type="button"
              disabled={disabled}
              onClick={handleDelete}
              title="מחק אות"
              className={`btn-3d btn-3d-dark text-rose-300 border-rose-500/30 shadow-[0_3px_0_#881337] active:bg-rose-500/40 ${keyBaseClass}`}
            >
              <Delete className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-400" />
            </button>
          </div>
        </div>
      ) : (
        /* English Uniform 10-Column Keyboard */
        <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
          {/* Row 0: 10 Letters (Q-P) */}
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 w-full">
            {ENGLISH_KEYBOARD_ROWS[0].map((char) => (
              <button
                key={char}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(char)}
                className={`btn-3d btn-3d-dark text-white active:bg-pink-500/40 ${keyBaseClass}`}
              >
                {char}
              </button>
            ))}
          </div>

          {/* Row 1: 0.5 spacer + 9 Letters (A-L) + 0.5 spacer */}
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 w-full">
            <div className="flex-[0.5] min-w-0 max-w-[20px] sm:max-w-[23px] pointer-events-none opacity-0" aria-hidden="true" />
            {ENGLISH_KEYBOARD_ROWS[1].map((char) => (
              <button
                key={char}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(char)}
                className={`btn-3d btn-3d-dark text-white active:bg-pink-500/40 ${keyBaseClass}`}
              >
                {char}
              </button>
            ))}
            <div className="flex-[0.5] min-w-0 max-w-[20px] sm:max-w-[23px] pointer-events-none opacity-0" aria-hidden="true" />
          </div>

          {/* Row 2: Hint + 7 Letters (Z-M) + Backspace + Spacer */}
          <div className="flex justify-center items-center gap-1 sm:gap-1.5 w-full">
            {onHintClick ? (
              <button
                type="button"
                onClick={handleHint}
                disabled={!canHint || disabled}
                title="Get a hint"
                className={`btn-3d ${keyBaseClass} flex-col ${
                  canHint && !disabled
                    ? 'btn-3d-dark text-amber-300 border-amber-500/40 shadow-[0_3px_0_#78350f]'
                    : 'bg-white/5 text-slate-500 border border-white/5 opacity-50 cursor-not-allowed'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-[9px] font-black leading-none mt-0.5">Hint</span>
              </button>
            ) : (
              <div className="flex-1 min-w-0 max-w-[40px] sm:max-w-[46px] h-11 sm:h-12 pointer-events-none opacity-0" aria-hidden="true" />
            )}

            {ENGLISH_KEYBOARD_ROWS[2].map((char) => (
              <button
                key={char}
                type="button"
                disabled={disabled}
                onClick={() => handleKey(char)}
                className={`btn-3d btn-3d-dark text-white active:bg-pink-500/40 ${keyBaseClass}`}
              >
                {char}
              </button>
            ))}

            <button
              type="button"
              disabled={disabled}
              onClick={handleDelete}
              title="Backspace"
              className={`btn-3d btn-3d-dark text-rose-300 border-rose-500/30 shadow-[0_3px_0_#881337] active:bg-rose-500/40 ${keyBaseClass}`}
            >
              <Delete className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-400" />
            </button>

            {/* Balances to 10 equal columns */}
            <div className="flex-1 min-w-0 max-w-[40px] sm:max-w-[46px] h-11 sm:h-12 pointer-events-none opacity-0 select-none" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
};
