import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Mock crypto payment processor (replace with real API like Coinbase Commerce, etc.)
async function createCryptoPaymentOrder(amount, cryptoCurrency) {
  // Simulate API call to crypto payment processor
  const exchangeRates = {
    'BTC': 45000,
    'ETH': 2500,
    'USDT': 1.00,
    'USDC': 1.00
  };

  const rate = exchangeRates[cryptoCurrency] || 1;
  const cryptoAmount = amount / rate;
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Mock payment URL (in production, this would be from the payment processor)
  const paymentUrl = `https://pay.example.com/order/${orderId}`;
  
  return {
    order_id: orderId,
    payment_url: paymentUrl,
    crypto_amount: cryptoAmount,
    exchange_rate: rate,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
  };
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, crypto_currency = 'USDT' } = await request.json();

    if (!amount) {
      return Response.json({ error: "Amount is required" }, { status: 400 });
    }

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      return Response.json({ error: "Amount must be positive" }, { status: 400 });
    }

    if (depositAmount < 10) {
      return Response.json({ error: "Minimum deposit amount is $10" }, { status: 400 });
    }

    if (depositAmount > 50000) {
      return Response.json({ error: "Maximum deposit amount is $50,000" }, { status: 400 });
    }

    const validCurrencies = ['BTC', 'ETH', 'USDT', 'USDC'];
    if (!validCurrencies.includes(crypto_currency)) {
      return Response.json({ error: "Invalid cryptocurrency" }, { status: 400 });
    }

    // Check user KYC status for large deposits
    if (depositAmount >= 1000) {
      const [user] = await sql`
        SELECT kyc_status FROM users WHERE id = ${session.user.id}
      `;

      if (!user || user.kyc_status !== 'approved') {
        return Response.json({ 
          error: "KYC approval required for deposits over $1,000" 
        }, { status: 403 });
      }
    }

    // Create crypto payment order
    const paymentData = await createCryptoPaymentOrder(depositAmount, crypto_currency);

    // Create crypto order record
    const [order] = await sql`
      INSERT INTO crypto_orders (
        user_id, amount, crypto_currency, fiat_amount, exchange_rate,
        external_order_id, payment_url, expires_at, status
      ) VALUES (
        ${session.user.id}, ${paymentData.crypto_amount}, ${crypto_currency}, 
        ${depositAmount}, ${paymentData.exchange_rate}, ${paymentData.order_id},
        ${paymentData.payment_url}, ${paymentData.expires_at}, 'pending'
      )
      RETURNING *
    `;

    // Create notification
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        ${session.user.id},
        'Deposit Order Created',
        'Your crypto deposit order for $${depositAmount} has been created. Complete payment within 30 minutes.',
        'transaction'
      )
    `;

    return Response.json({
      order: {
        id: order.id,
        external_order_id: order.external_order_id,
        payment_url: order.payment_url,
        amount: order.amount,
        crypto_currency: order.crypto_currency,
        fiat_amount: order.fiat_amount,
        exchange_rate: order.exchange_rate,
        expires_at: order.expires_at,
        status: order.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating crypto deposit order:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await sql`
      SELECT * FROM crypto_orders 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return Response.json({ orders });
  } catch (error) {
    console.error("Error fetching crypto orders:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}