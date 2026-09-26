import React, { useState } from 'react';
import { CardItem, Language } from '../types/game';
import { X, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';
import { sounds } from '../utils/audio';

interface CustomCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: CardItem) => void;
  language?: Language;
}

export const CustomCardModal: React.FC<CustomCardModalProps> = ({
  isOpen,
  onClose,
  onAddCard,
  language = 'he',
}) => {
  const isEn = language === 'en';
  const [word, setWord] = useState('');
  const [category, setCategory] = useState(isEn ? 'General' : 'כללי');
  const [imageUrl, setImageUrl] = useState('');
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) {
      setError(isEn ? 'Please enter the target word' : 'נא להזין מילה לניחוש');
      sounds.soundError();
      return;
    }
    if (!imageUrl.trim()) {
      setError(isEn ? 'Please enter an image URL' : 'נא להזין קישור לתמונה');
      sounds.soundError();
      return;
    }

    const cleanWord = word.trim().replace(/\s+/g, '');
    const newCard: CardItem = {
      id: 'custom-' + Date.now(),
      word: cleanWord,
      word_he: isEn ? undefined : cleanWord,
      word_en: isEn ? cleanWord : undefined,
      category: category.trim() || (isEn ? 'General' : 'כללי'),
      category_en: isEn ? category.trim() : undefined,
      image: imageUrl.trim(),
      hint: hint.trim() || undefined,
      hint_en: isEn ? hint.trim() : undefined,
    };

    sounds.soundSuccess();
    onAddCard(newCard);
    onClose();
  };

  const sampleImages = isEn
    ? [
        { name: 'Apple', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80', cat: 'Food' },
        { name: 'Horse', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', cat: 'Animals' },
        { name: 'Book', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', cat: 'Objects' },
        { name: 'Star', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80', cat: 'Space' },
      ]
    : [
        { name: 'תפוח', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80', cat: 'אוכל' },
        { name: 'סוס', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80', cat: 'חיות' },
        { name: 'ספר', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', cat: 'חפצים' },
        { name: 'כוכב', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80', cat: 'חלל' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn" dir={isEn ? 'ltr' : 'rtl'}>
      <div className="bg-[#1E1B4B] border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className={`absolute top-4 ${isEn ? 'right-4' : 'left-4'} p-2 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 cursor-pointer transition-all`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-pink-400" />
          <h2 className="text-xl font-black text-white">
            {isEn ? 'Create Custom Card' : 'הוספת קלף מותאם אישית'}
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isEn ? 'Word to guess:' : 'המילה לניחוש:'}
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => {
                setWord(e.target.value);
                setError('');
              }}
              placeholder={isEn ? 'e.g. Horse' : 'למשל: סוס'}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isEn ? 'Category:' : 'קטגוריה:'}
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={isEn ? 'e.g. Animals / Food / Objects' : 'למשל: חיות / אוכל / חפצים'}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isEn ? 'Image URL:' : 'כתובת תמונה (URL):'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setError('');
                }}
                placeholder="https://..."
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {isEn ? 'Optional Hint:' : 'רמז אופציונלי:'}
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder={isEn ? 'e.g. Gallops across fields and has hooves' : 'למשל: דוהר בשדה ויש לו פרסות'}
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Quick presets */}
          <div>
            <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{isEn ? 'Ready images for fast pick:' : 'תמונות מוכנות לבחירה מהירה:'}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sampleImages.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setWord(s.name);
                    setImageUrl(s.url);
                    setCategory(s.cat);
                  }}
                  className="p-1 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500 text-[11px] text-slate-300 text-center truncate cursor-pointer transition-all"
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {imageUrl && (
            <div className="w-full h-24 rounded-xl overflow-hidden border border-white/20">
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 active:scale-98 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 mt-2 cursor-pointer transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>{isEn ? 'Add Card to Game' : 'הוסף קלף למשחק'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
