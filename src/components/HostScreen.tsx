import React, { useState, useEffect } from 'react';
import { Player, RoomSettings, Language } from '../types/game';
import { CATEGORIES } from '../data/cards';
import { translations } from '../utils/translations';
import {
  Crown,
  CreditCard,
  Copy,
  Check,
  Play,
  ArrowRight,
  ArrowLeft,
  Settings,
  PlusCircle,
  Users,
  Timer,
  Share2,
  Globe,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Mail,
  Loader2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Trophy
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HostScreenProps {
  pin: string;
  hasPurchasedLicense: boolean;
  onPurchaseLicense: (contact?: string) => void;
  onStartGame: () => void;
  onBack: () => void;
  players: Player[];
  onOpenCustomCardModal: () => void;
  onOpenShareModal: () => void;
  customCardsCount: number;
  settings: RoomSettings;
  onUpdateSettings: (newSettings: RoomSettings) => void;
  language?: Language;
  onToggleLanguage?: () => void;
  returnedPaymentContact?: string;
  onGenerateNewPin?: () => void;
  onOpenLeaderboard?: () => void;
}

export const HostScreen: React.FC<HostScreenProps> = ({
  pin,
  hasPurchasedLicense,
  onPurchaseLicense,
  onStartGame,
  onBack,
  players,
  onOpenCustomCardModal,
  onOpenShareModal,
  customCardsCount,
  settings,
  onUpdateSettings,
  language = 'he',
  onToggleLanguage,
  returnedPaymentContact,
  onGenerateNewPin,
  onOpenLeaderboard,
}) => {
  const t = translations[language];
  const isEn = language === 'en';

  // Local UI state
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>(() => sounds.getVoiceGender());

  // Delivery Channel: 'email' | 'sms'
  const [deliveryChannel, setDeliveryChannel] = useState<'email' | 'sms'>('email');

  // Payment & OTP Flow state
  const [flowStep, setFlowStep] = useState<'pay' | 'otp'>(returnedPaymentContact ? 'otp' : 'pay');
  const [contactInput, setContactInput] = useState(() => {
    if (returnedPaymentContact) return returnedPaymentContact;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('temp_host_contact') || localStorage.getItem('ttg_host_contact') || '';
    }
    return '';
  });
  const [otpInput, setOtpInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(() => {
    if (returnedPaymentContact) {
      return {
        type: 'info',
        text: isEn
          ? 'Payment received! Enter your 4-digit verification code to activate lifetime host access (Demo code: 1234)'
          : 'התשלום התקבל בהצלחה! הזן את קוד האימות בן 4 הספרות להפעלת רישיון המארח/ת (קוד סימולציה: 1234)',
      };
    }
    return null;
  });

  // If user returned from payment with contact, switch to OTP screen immediately
  useEffect(() => {
    if (returnedPaymentContact && !hasPurchasedLicense) {
      setFlowStep('otp');
      setContactInput(returnedPaymentContact);
      if (returnedPaymentContact.includes('@')) {
        setDeliveryChannel('email');
      } else {
        setDeliveryChannel('sms');
      }
      setStatusMessage({
        type: 'info',
        text: isEn
          ? 'Payment completed! Enter verification code (Demo: 1234) to activate.'
          : 'התשלום בוצע בהצלחה! הזן את קוד האימות (קוד הדגמה: 1234) להפעלת הרישיון.',
      });
    }
  }, [returnedPaymentContact, hasPurchasedLicense, isEn]);

  const handleCopyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    sounds.soundSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleCategory = (cat: string) => {
    sounds.soundKeypress();
    if (cat === 'הכל') {
      onUpdateSettings({ ...settings, selectedCategories: ['הכל'] });
      return;
    }
    let newCats = settings.selectedCategories.filter((c) => c !== 'הכל');
    if (newCats.includes(cat)) {
      newCats = newCats.filter((c) => c !== cat);
      if (newCats.length === 0) newCats = ['הכל'];
    } else {
      newCats.push(cat);
    }
    onUpdateSettings({ ...settings, selectedCategories: newCats });
  };

  // Step 1: Initiate Checkout (Stripe with Apple Pay / Google Pay / Demo)
  const handleInitiateCheckout = async () => {
    const contact = contactInput.trim();
    if (!contact) {
      setStatusMessage({
        type: 'error',
        text: isEn
          ? deliveryChannel === 'email' ? 'Please enter a valid email address' : 'Please enter a valid mobile phone number'
          : deliveryChannel === 'email' ? 'אנא הזן כתובת דוא״ל תקינה' : 'אנא הזן מספר טלפון נייד תקין',
      });
      sounds.soundError();
      return;
    }

    sounds.soundKeypress();
    setIsLoading(true);
    setStatusMessage(null);

    if (typeof window !== 'undefined') {
      localStorage.setItem('temp_host_contact', contact);
    }

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactInfo: contact,
          contactType: deliveryChannel,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Stripe Checkout (native Apple Pay & Google Pay)
        window.location.href = data.url;
        return;
      }

      // Demo/simulation fallback
      const demoCode = data.code || '1234';
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('current_otp', demoCode);
      }

      setFlowStep('otp');
      setStatusMessage({
        type: 'info',
        text: isEn
          ? `[Simulation Mode] Verification code sent to ${contact}: ${demoCode}`
          : `[הודעת סימולציה] קוד האימות שלך לרכישה הוא: ${demoCode}`,
      });
      sounds.soundSuccess();
    } catch (err) {
      console.warn('Checkout API error, falling back to simulation:', err);
      const demoCode = '1234';
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('current_otp', demoCode);
      }
      setFlowStep('otp');
      setStatusMessage({
        type: 'info',
        text: isEn
          ? `[Offline Demo] Verification code is: ${demoCode}`
          : `[מצב הדגמה מקומי] קוד האימות הוא: ${demoCode}`,
      });
      sounds.soundSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  // Request OTP for license restoration / resend
  const handleRequestRestoreOtp = async () => {
    const contact = contactInput.trim();
    if (!contact) {
      setStatusMessage({
        type: 'error',
        text: isEn
          ? 'Enter your registered email or phone to restore your license'
          : 'הזן את המייל או הטלפון עמם נרכש הרישיון לשחזור',
      });
      sounds.soundError();
      return;
    }

    sounds.soundKeypress();
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactInfo: contact }),
      });
      const data = await res.json();
      const code = data.demoCode || '1234';

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('current_otp', code);
      }

      setFlowStep('otp');
      setStatusMessage({
        type: 'info',
        text: isEn
          ? `Verification code sent to ${contact}. (Demo code: ${code})`
          : `קוד אימות נשלח אל ${contact}. (קוד בדיקה: ${code})`,
      });
      sounds.soundSuccess();
    } catch {
      setFlowStep('otp');
      setStatusMessage({
        type: 'info',
        text: isEn
          ? 'Verification code sent! (Demo code: 1234)'
          : 'קוד אימות נשלח! (קוד בדיקה: 1234)',
      });
      sounds.soundSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 4-digit OTP
  const handleVerifyOtp = async () => {
    const entered = otpInput.trim();
    if (!entered || entered.length < 4) {
      setStatusMessage({
        type: 'error',
        text: isEn ? 'Please enter a valid 4-digit code' : 'נא להזין קוד אימות בן 4 ספרות',
      });
      sounds.soundError();
      return;
    }

    sounds.soundKeypress();
    setIsLoading(true);
    setStatusMessage(null);

    const storedOtp = typeof window !== 'undefined' ? sessionStorage.getItem('current_otp') : null;

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactInfo: contactInput.trim(),
          otp: entered,
        }),
      });

      const data = await res.json();

      if (res.ok && data.verified) {
        completeActivation(data.contact || contactInput.trim());
        return;
      }

      // Check local fallback
      if (entered === '1234' || entered === storedOtp) {
        completeActivation(contactInput.trim());
        return;
      }

      setStatusMessage({
        type: 'error',
        text: data.error || (isEn ? 'Incorrect code, please try again.' : 'קוד אימות שגוי, אנא נסה שוב.'),
      });
      sounds.soundError();
    } catch {
      if (entered === '1234' || entered === storedOtp) {
        completeActivation(contactInput.trim());
        return;
      }
      setStatusMessage({
        type: 'error',
        text: isEn ? 'Incorrect code, please try again.' : 'קוד שגוי, אנא נסה שוב.',
      });
      sounds.soundError();
    } finally {
      setIsLoading(false);
    }
  };

  const completeActivation = (contact: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ttg_host_active', 'true');
      if (contact) {
        localStorage.setItem('ttg_host_contact', contact);
      }
    }
    sounds.soundSuccess();
    onPurchaseLicense(contact);
  };

  return (
    <div id="screen-host" className="w-full flex flex-col items-center animate-fadeIn select-none screen" dir={isEn ? 'ltr' : 'rtl'}>
      {/* Top navigation */}
      <div className="w-full flex items-center justify-between mb-3">
        <button
          onClick={() => {
            sounds.soundKeypress();
            onBack();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-sm font-semibold transition-all cursor-pointer"
        >
          {isEn ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowRight className="w-4 h-4 ml-1" />}
          <span>{t.back}</span>
        </button>

        <div className="flex items-center gap-2">
          {onOpenLeaderboard && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onOpenLeaderboard();
              }}
              className="bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-400/40 text-amber-200 hover:text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title={isEn ? 'Global Leaderboard' : 'טבלת שיאים עולמית'}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">{isEn ? 'Leaderboard' : 'טבלת שיאים'}</span>
            </button>
          )}

          {onToggleLanguage && (
            <button
              onClick={() => {
                sounds.soundKeypress();
                onToggleLanguage();
              }}
              className="bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              title={isEn ? 'עבור לעברית' : 'Switch to English'}
            >
              <Globe className="w-3 h-3 text-pink-400" />
              <span>{t.langBtn}</span>
            </button>
          )}

          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            <Crown className="w-3.5 h-3.5 text-yellow-300" />
            <span>{isEn ? 'Host Manager' : 'ניהול מארח/ת'}</span>
          </span>
        </div>
      </div>

      <h1 id="t-host-title" className="text-2xl sm:text-3xl font-black text-center mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-300">
        {t.hostTitle}
      </h1>
      <p id="t-host-sub" className="text-xs sm:text-sm text-slate-300 text-center mb-4 subtitle">
        {t.hostSub}
      </p>

      {/* Status banner (messages / errors) */}
      {statusMessage && (
        <div
          className={`w-full max-w-md p-3 rounded-2xl mb-4 text-xs font-bold flex items-start gap-2.5 border shadow-lg animate-fadeIn ${
            statusMessage.type === 'error'
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
              : statusMessage.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
          <span className="leading-relaxed">{statusMessage.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* FLOW 1 & 2: LICENSE PURCHASE & OTP VERIFICATION (NOT LICENSED) */}
      {/* ============================================================== */}
      {!hasPurchasedLicense ? (
        <div className="w-full max-w-md">
          {flowStep === 'pay' ? (
            /* שלב 1: רכישה ובחירת קבלת קוד (SMS או מייל) */
            <div id="host-pay-flow" className="w-full bg-gradient-to-b from-white/10 to-black/30 border border-white/20 rounded-[22px] p-5 sm:p-6 text-center shadow-2xl relative overflow-hidden mb-4">
              {/* Subtle top spotlight */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown className="w-7 h-7 text-purple-950 fill-purple-950" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-amber-300 mb-1">
                {isEn ? '🌟 Lifetime Host License' : '🌟 רישיון מארח/ת לכל החיים'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mb-4 max-w-xs mx-auto leading-relaxed">
                {isEn
                  ? <>One-time payment of <b className="text-amber-300">29 ₪ only</b> for unlimited game hosting.</>
                  : <>תשלום חד-פעמי של <b className="text-amber-300">29 ₪ בלבד</b> לאירוח ללא הגבלה.</>}
              </p>

              {/* Supported payment badges (Apple Pay, Google Pay, Credit Cards) */}
              <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                <span className="bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span></span>
                  <span>Apple Pay</span>
                </span>
                <span className="bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                  <span className="font-black text-amber-300">G</span>
                  <span>Google Pay</span>
                </span>
                <span className="bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
                  <CreditCard className="w-3.5 h-3.5 text-pink-300" />
                  <span>{isEn ? 'Credit Card' : '💳 כרטיס אשראי'}</span>
                </span>
              </div>

              {/* בורר ערוץ שליחה: מייל או SMS */}
              <div className={`mb-4 ${isEn ? 'text-left' : 'text-right'}`}>
                <label className="text-xs sm:text-[13px] text-slate-200 block mb-2 font-bold flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-pink-400" />
                  <span>{isEn ? 'How would you like to receive your license code?' : 'כיצד תרצה לקבל את קוד הרישיון?'}</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    id="btn-channel-email"
                    onClick={() => {
                      sounds.soundKeypress();
                      setDeliveryChannel('email');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      deliveryChannel === 'email'
                        ? 'bg-gradient-to-r from-purple-600/70 to-pink-600/70 border-pink-400 text-white shadow-md shadow-pink-500/20 ring-2 ring-pink-400/40'
                        : 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-300'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-pink-300" />
                    <span>{isEn ? '📧 By Email' : '📧 בדוא״ל (מייל)'}</span>
                  </button>

                  <button
                    type="button"
                    id="btn-channel-sms"
                    onClick={() => {
                      sounds.soundKeypress();
                      setDeliveryChannel('sms');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      deliveryChannel === 'sms'
                        ? 'bg-gradient-to-r from-purple-600/70 to-pink-600/70 border-pink-400 text-white shadow-md shadow-pink-500/20 ring-2 ring-pink-400/40'
                        : 'bg-white/10 hover:bg-white/15 border-white/20 text-slate-300'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-teal-300" />
                    <span>{isEn ? '📱 By SMS (Mobile)' : '📱 ב-SMS (לנייד)'}</span>
                  </button>
                </div>
              </div>

              {/* שדה קלט דינמי לפי הערוץ שנבחר */}
              <div className={`mb-4.5 input-group ${isEn ? 'text-left' : 'text-right'}`}>
                <label id="channel-input-label" className="block text-xs font-bold text-slate-300 mb-1.5">
                  {deliveryChannel === 'email'
                    ? (isEn ? 'Enter email address for code delivery:' : 'הזן כתובת דוא״ל לשליחת הקוד:')
                    : (isEn ? 'Enter mobile phone number for SMS delivery:' : 'הזן מספר טלפון נייד לשליחת הקוד:')}
                </label>
                <div className="relative">
                  <input
                    type={deliveryChannel === 'email' ? 'email' : 'tel'}
                    id="host-contact-input"
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder={deliveryChannel === 'email' ? 'yourname@gmail.com' : '050-1234567'}
                    className="w-full py-3 px-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all text-center input-field"
                  />
                </div>
              </div>

              {/* Fast Checkout Button */}
              <button
                onClick={handleInitiateCheckout}
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 hover:from-amber-300 hover:to-pink-400 active:scale-98 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-orange-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mb-2.5 btn btn-action"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>{isEn ? '💳 Fast Checkout (29 ₪)' : '💳 מעבר לתשלום מהיר (29 ₪)'}</span>
                  </>
                )}
              </button>

              {/* Direct OTP entry if already paid */}
              <button
                type="button"
                onClick={() => {
                  sounds.soundKeypress();
                  setFlowStep('otp');
                  setStatusMessage(null);
                }}
                className="text-xs text-purple-300 hover:text-white underline cursor-pointer py-1 transition-colors block mx-auto font-medium"
              >
                {isEn ? 'Already paid? Enter verification code directly' : 'כבר שילמת? הזן קוד אימות ישירות'}
              </button>
            </div>
          ) : (
            /* שלב 2: הזנת קוד אימות */
            <div id="host-otp-box" className="w-full bg-gradient-to-b from-white/10 to-black/30 border border-white/20 rounded-[22px] p-5 sm:p-6 text-center shadow-2xl relative overflow-hidden animate-fadeIn mb-4">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
                <KeyRound className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-emerald-400 mb-1">
                {isEn ? '🔑 Host License Verification' : '🔑 אימות רישיון מארח/ת'}
              </h3>
              <p id="otp-destination-msg" className="text-xs sm:text-sm text-slate-200 mb-1 max-w-xs mx-auto leading-relaxed">
                {isEn
                  ? 'Enter the 4-digit verification code you received:'
                  : 'הזן את קוד האימות בן 4 הספרות שקיבלת:'}
              </p>
              <p className="text-[11px] text-amber-300 mb-4 font-semibold">
                {isEn ? '(Please also check your Spam folder if you chose email)' : '(בדוק גם בתיקיית הספאם אם בחרת במייל)'}
              </p>

              {/* 4-digit code input */}
              <div className="mb-4">
                <input
                  type="text"
                  maxLength={4}
                  id="otp-input"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="____"
                  className="w-44 py-3 text-center text-3xl font-black tracking-[0.35em] font-mono rounded-2xl bg-black/50 border-2 border-emerald-400/80 text-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 mx-auto block shadow-inner input-field"
                  autoFocus
                />
                <span className="text-[11px] text-slate-400 block mt-1.5 font-medium">
                  {isEn ? 'Code for test simulation: 1234' : 'קוד אימות לבדיקה / סימולציה: 1234'}
                </span>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 active:scale-98 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-teal-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 mb-2.5 btn btn-action"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>{isEn ? '✅ Verify & Activate Host' : '✅ אימות והפעלת מארח/ת'}</span>
                  </>
                )}
              </button>

              {/* Back to payment */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    sounds.soundKeypress();
                    handleRequestRestoreOtp();
                  }}
                  className="text-slate-300 hover:text-white underline cursor-pointer"
                >
                  {isEn ? 'Resend code' : 'שלח קוד שוב'}
                </button>
                <span className="text-slate-500">•</span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.soundKeypress();
                    setFlowStep('pay');
                    setStatusMessage(null);
                  }}
                  className="text-slate-300 hover:text-white underline cursor-pointer"
                >
                  {isEn ? 'Go Back' : 'חזור אחורה'}
                </button>
              </div>
            </div>
          )}

          {/* Quick timer configuration preview before purchase */}
          <div className={`mt-2 bg-black/30 border border-white/10 rounded-2xl p-3 text-center ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-pink-400" />
                {t.timerSettingsTitle}
              </span>
              <span className="text-xs font-bold text-amber-300 font-mono">
                {settings.turnDuration === 60 ? (isEn ? '1 Min' : 'דקה') : `${settings.turnDuration}s`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { sec: 15, label: t.sec15 },
                { sec: 30, label: t.sec30 },
                { sec: 45, label: t.sec45 },
                { sec: 60, label: t.sec60 },
              ].map(({ sec, label }) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    sounds.soundKeypress();
                    onUpdateSettings({ ...settings, turnDuration: sec });
                  }}
                  className={`py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    settings.turnDuration === sec
                      ? 'bg-pink-500/30 border-pink-400 text-white shadow-sm ring-1 ring-pink-400/40'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* STEP 3: READY HOST ROOM (PIN GENERATED, UNLIMITED ACCESS)       */
        /* ============================================================== */
        <div id="host-ready-box" className="w-full max-w-md bg-white/10 border border-white/20 rounded-3xl p-5 text-center shadow-2xl mb-4 animate-fadeIn">
          {/* Active Lifetime Host Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black mb-3 shadow-sm">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>{isEn ? '👑 Lifetime Host License Active' : '👑 רישיון מארח/ת פעיל לכל החיים'}</span>
          </div>

          <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            {isEn ? 'Room PIN Code to share:' : 'קוד ה-PIN של החדר לשיתוף:'}
          </p>

          {/* PIN Card display */}
          <div id="room-pin-display" className="relative inline-flex items-center justify-center px-8 py-3 my-2 bg-black/40 border-2 border-dashed border-amber-400/80 rounded-2xl shadow-inner text-4xl sm:text-5xl font-black text-amber-300 tracking-[0.25em] font-mono select-all">
            {pin}
          </div>

          {/* Action buttons (Copy PIN, Share Room, Refresh PIN) */}
          <div className="flex flex-wrap justify-center gap-2 mt-2 mb-4">
            <button
              onClick={handleCopyPin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-white border border-white/15 transition-all cursor-pointer shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? t.pinCopied : t.copyPin}</span>
            </button>

            {onGenerateNewPin && (
              <button
                onClick={() => {
                  sounds.soundKeypress();
                  onGenerateNewPin();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-bold text-amber-200 border border-amber-400/30 transition-all cursor-pointer shadow-sm"
                title={isEn ? 'Generate new room PIN' : 'החלף קוד PIN חדש'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
                <span>{isEn ? 'New PIN' : 'קוד חדש'}</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.soundKeypress();
                onOpenShareModal();
              }}
              className="relative group overflow-hidden flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600/35 via-fuchsia-600/30 to-purple-600/35 hover:from-pink-500/50 hover:via-fuchsia-500/45 hover:to-purple-500/50 active:scale-95 text-xs sm:text-sm font-extrabold text-pink-100 hover:text-white border border-pink-400/50 hover:border-pink-300 transition-all duration-300 cursor-pointer shadow-lg animate-pulse-glow-share"
            >
              {/* Dynamic animated reflective diagonal light sweep */}
              <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none animate-shimmer-sweep" />

              {/* Glowing ambient background aura on hover */}
              <span className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-25 group-hover:opacity-60 transition-opacity pointer-events-none" />

              <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-pink-500/30 border border-pink-300/40 shadow-inner group-hover:scale-110 transition-transform">
                <Share2 className="w-3.5 h-3.5 text-pink-200 group-hover:text-white animate-share-wiggle" />
              </span>

              <span className="relative tracking-wide drop-shadow-sm font-black">
                {isEn ? 'Share Room (WhatsApp / QR)' : 'שיתוף והזמנה (WhatsApp / QR)'}
              </span>

              <Sparkles className="relative w-3.5 h-3.5 text-amber-300 animate-pulse hidden sm:inline-block" />
            </button>
          </div>

          {/* Connected players list preview */}
          <div className={`w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-4 ${isEn ? 'text-left' : 'text-right'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                {t.connectedPlayers} ({players.length}):
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                {isEn ? 'Synchronized' : 'מסונכרן'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-xl text-xs text-white border border-white/10 shadow-sm"
                >
                  <span>{p.name}</span>
                  {p.isHost && <span className="text-[10px] text-amber-300 font-bold">(Host)</span>}
                </div>
              ))}
              {players.filter((p) => !p.isHost).length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  {isEn ? 'Waiting for players to join via PIN...' : 'ממתין להצטרפות משתתפים עם קוד ה-PIN...'}
                </p>
              )}
            </div>
          </div>

          {/* Collapsible Settings Toggle */}
          <button
            onClick={() => {
              sounds.soundKeypress();
              setShowSettings(!showSettings);
            }}
            className="flex items-center justify-center gap-1.5 w-full py-2 mb-3 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-pink-400" />
            <span>{showSettings ? (isEn ? 'Hide Room Settings' : 'הסתר הגדרות חדר') : (isEn ? 'Customize Timer & Categories' : 'התאמת טיימר וקטגוריות')}</span>
          </button>

          {showSettings && (
            <div className={`space-y-4 mb-4 bg-black/30 p-3.5 rounded-2xl border border-white/10 animate-fadeIn ${isEn ? 'text-left' : 'text-right'}`}>
              {/* Turn Duration */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  ⏱️ {isEn ? 'Seconds per turn:' : 'משך זמן לכל תור:'}
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { sec: 15, label: t.sec15 },
                    { sec: 30, label: t.sec30 },
                    { sec: 45, label: t.sec45 },
                    { sec: 60, label: t.sec60 },
                  ].map(({ sec, label }) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        sounds.soundKeypress();
                        onUpdateSettings({ ...settings, turnDuration: sec });
                      }}
                      className={`py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        settings.turnDuration === sec
                          ? 'bg-pink-500/30 border-pink-400 text-white ring-1 ring-pink-400/40'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  📁 {isEn ? 'Included categories:' : 'קטגוריות משחק:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['הכל', ...CATEGORIES].map((cat) => {
                    const isSelected = settings.selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500/30 border-purple-400 text-white ring-1 ring-purple-400/40'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reaction Voice Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  🔊 {t.voiceSettings}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender('female');
                      sounds.setVoiceGender('female');
                      sounds.previewVoice('female', language);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      voiceGender === 'female'
                        ? 'bg-pink-500/35 border-pink-400 text-white ring-1 ring-pink-400/40 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>👩</span>
                    <span>{t.voiceFemale}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceGender('male');
                      sounds.setVoiceGender('male');
                      sounds.previewVoice('male', language);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      voiceGender === 'male'
                        ? 'bg-indigo-500/35 border-indigo-400 text-white ring-1 ring-indigo-400/40 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>👨</span>
                    <span>{t.voiceMale}</span>
                  </button>
                </div>
              </div>

              {/* Custom cards modal button */}
              <button
                type="button"
                onClick={() => {
                  sounds.soundKeypress();
                  onOpenCustomCardModal();
                }}
                className="w-full py-2 px-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 border border-pink-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isEn ? `Custom Cards (${customCardsCount})` : `הוספת קלפים אישיים (${customCardsCount})`}</span>
              </button>
            </div>
          )}

          {/* Main Launch Game Button */}
          <button
            onClick={() => {
              sounds.soundSuccess();
              onStartGame();
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#00B894] to-[#00CEC9] hover:from-[#02a786] hover:to-[#00b8b4] active:scale-98 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-teal-900/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer btn btn-host"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{isEn ? '🚀 Everyone Connected - Start Game!' : '🚀 כולם מחוברים - התחל משחק!'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
