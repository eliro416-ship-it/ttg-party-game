// netlify/functions/create-checkout.cjs

```javascript
import Stripe from 'stripe';

export const handler = async (event) => {


  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { contactInfo, contactType } = JSON.parse(event.body || '{}');

    if (!contactInfo) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Contact info is required' }),
      };
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      // Offline / sandbox fallback
      return {
        statusCode: 200,
        body: JSON.stringify({
          demo: true,
          code: '1234',
          message: 'Demo mode active',
          contact: contactInfo,
        }),
      };
    }

    const stripe = new Stripe(stripeKey);
    const origin = event.headers.origin || 'http://localhost:3000';

    // יצירת סשן תשלום של 29 ש"ח עם תמיכה מובנית ב-Apple Pay ו-Google Pay
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'], // כרטיסי אשראי, כולל Apple Pay ו-Google Pay אוטומטית
      line_items: [
        {
          price_data: {
            currency: 'ils',
            product_data: {
              name: 'Time to Guess - רישיון מארח/ת לכל החיים',
              description: 'אירוח משחקים ללא הגבלה ושיתוף קוד PIN מכל מכשיר',
            },
            unit_amount: 2900, // 29.00 ₪ (בסנטים/אגורות)
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

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
