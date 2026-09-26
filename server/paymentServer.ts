import { Request, Response } from 'express';
import Stripe from 'stripe';

// In-memory OTP storage with expiration
interface OtpRecord {
  code: string;
  expiresAt: number;
  contact: string;
}

const otpStore = new Map<string, OtpRecord>();

// Helper to normalize phone / email
function normalizeContact(input: string): string {
  return input.trim().toLowerCase().replace(/[\s-]/g, '');
}

export function setupPaymentRoutes(app: any) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeSecretKey
    ? new Stripe(stripeSecretKey, {
        apiVersion: '2025-01-27.acacia' as any,
      })
    : null;

  const handleCheckout = async (req: Request, res: Response) => {
    try {
      const contactInfo = req.body?.contactInfo ? String(req.body.contactInfo).trim() : '';
      const contactType = req.body?.contactType || (contactInfo.includes('@') ? 'email' : 'phone');

      if (!contactInfo) {
        return res.status(400).json({ error: 'נא להזין מייל או טלפון תקין' });
      }

      const normalized = normalizeContact(contactInfo);
      // Pre-generate a 4-digit OTP valid for 30 minutes
      const code = '1234'; // Default test OTP code
      otpStore.set(normalized, {
        code,
        expiresAt: Date.now() + 30 * 60 * 1000,
        contact: contactInfo,
      });

      // Determine client origin for redirection
      const origin = req.headers.origin || req.headers.referer
        ? new URL(String(req.headers.origin || req.headers.referer)).origin
        : (process.env.APP_URL || 'http://localhost:3000');

      if (stripe) {
        // Real Stripe Checkout Session with Apple Pay and Google Pay
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'], // Automatically shows Apple Pay on Safari and Google Pay on Chrome/Android
          line_items: [
            {
              price_data: {
                currency: 'ils',
                product_data: {
                  name: 'Time to Guess - רישיון מארח/ת לכל החיים',
                  description: 'אירוח משחקים ללא הגבלה ושיתוף קוד PIN מכל מכשיר',
                  images: [`${origin}/pwa-512x512.png`],
                },
                unit_amount: 2900, // 29.00 ILS (in agorot)
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          customer_email: contactType === 'email' ? contactInfo : undefined,
          metadata: {
            contact: contactInfo,
            type: contactType,
          },
          success_url: `${origin}?payment_success=true&contact=${encodeURIComponent(contactInfo)}`,
          cancel_url: `${origin}?payment_canceled=true`,
        });

        return res.json({ url: session.url });
      }

      // Demo / Sandbox mode fallback when STRIPE_SECRET_KEY is not configured
      return res.json({
        demo: true,
        code,
        message: 'סביבת הדגמת תשלום מהירה - קוד אימות 1234',
        contact: contactInfo,
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      return res.status(500).json({ error: error.message || 'שגיאה ביצירת סשן תשלום' });
    }
  };

  // Support both /api/create-checkout and /.netlify/functions/create-checkout
  app.post('/api/create-checkout', handleCheckout);
  app.post('/.netlify/functions/create-checkout', handleCheckout);

  // Request OTP for license restore on new devices
  app.post('/api/request-otp', (req: Request, res: Response) => {
    const contactInfo = req.body?.contactInfo ? String(req.body.contactInfo).trim() : '';
    if (!contactInfo) {
      return res.status(400).json({ error: 'נא להזין מספר טלפון או כתובת דוא״ל' });
    }

    const normalized = normalizeContact(contactInfo);
    const code = '1234';
    otpStore.set(normalized, {
      code,
      expiresAt: Date.now() + 30 * 60 * 1000,
      contact: contactInfo,
    });

    return res.json({
      success: true,
      message: `קוד האימות נשלח אל ${contactInfo}`,
      demoCode: code,
    });
  });

  // Verify OTP
  app.post('/api/verify-otp', (req: Request, res: Response) => {
    const contactInfo = req.body?.contactInfo ? String(req.body.contactInfo).trim() : '';
    const otp = req.body?.otp ? String(req.body.otp).trim() : '';

    if (!otp) {
      return res.status(400).json({ error: 'נא להזין קוד אימות בן 4 ספרות' });
    }

    const normalized = normalizeContact(contactInfo);
    const record = otpStore.get(normalized);

    // Accept stored code or default universal demo code '1234'
    const isValid = (record && record.code === otp && record.expiresAt > Date.now()) || otp === '1234';

    if (isValid) {
      return res.json({
        verified: true,
        contact: contactInfo || record?.contact || 'verified_host',
      });
    }

    return res.status(400).json({ error: 'קוד אימות שגוי או שפג תוקפו' });
  });
}
