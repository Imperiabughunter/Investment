import sql from "@/app/api/utils/sql";

// Webhook handler for crypto payment confirmations
export async function POST(request) {
  try {
    const { order_id, status, transaction_hash } = await request.json();

    if (!order_id || !status) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the crypto order
    const [order] = await sql`
      SELECT * FROM crypto_orders WHERE external_order_id = ${order_id}
    `;

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === 'completed') {
      return Response.json({ message: "Order already processed" }, { status: 200 });
    }

    if (status === 'completed' || status === 'confirmed') {
      // Get user's wallet
      const [wallet] = await sql`
        SELECT * FROM wallets WHERE user_id = ${order.user_id} AND currency = 'USD'
      `;

      if (!wallet) {
        console.error(`Wallet not found for user ${order.user_id}`);
        return Response.json({ error: "Wallet not found" }, { status: 404 });
      }

      const depositAmount = parseFloat(order.fiat_amount);
      const balanceBefore = parseFloat(wallet.balance);
      const balanceAfter = balanceBefore + depositAmount;

      // Process the deposit in a transaction
      await sql.transaction([
        // Update crypto order status
        sql`
          UPDATE crypto_orders 
          SET status = 'completed', completed_at = CURRENT_TIMESTAMP
          WHERE id = ${order.id}
        `,
        
        // Update wallet balance
        sql`
          UPDATE wallets 
          SET balance = ${balanceAfter}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${order.user_id} AND currency = 'USD'
        `,
        
        // Create transaction record
        sql`
          INSERT INTO transactions (
            user_id, wallet_id, type, amount, balance_before, balance_after,
            description, reference_id, reference_type, external_reference, status
          ) VALUES (
            ${order.user_id}, ${wallet.id}, 'deposit', ${depositAmount},
            ${balanceBefore}, ${balanceAfter},
            'Crypto deposit via ${order.crypto_currency}', 
            ${order.id}, 'crypto_deposit', ${transaction_hash || order_id}, 'completed'
          )
        `,
        
        // Create success notification
        sql`
          INSERT INTO notifications (user_id, title, message, type)
          VALUES (
            ${order.user_id},
            'Deposit Confirmed',
            'Your crypto deposit of $${depositAmount} has been confirmed and added to your wallet.',
            'transaction'
          )
        `
      ]);

      console.log(`Processed crypto deposit: $${depositAmount} for user ${order.user_id}`);
      
      return Response.json({ 
        message: "Deposit processed successfully",
        amount: depositAmount,
        new_balance: balanceAfter
      }, { status: 200 });

    } else if (status === 'failed' || status === 'expired') {
      // Update order status to failed
      await sql`
        UPDATE crypto_orders 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${order.id}
      `;

      // Create failure notification
      await sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          ${order.user_id},
          'Deposit Failed',
          'Your crypto deposit order has ${status}. Please try again or contact support.',
          'transaction'
        )
      `;

      return Response.json({ 
        message: `Order marked as ${status}` 
      }, { status: 200 });
    }

    return Response.json({ message: "Status updated" }, { status: 200 });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint for webhook verification (some payment processors require this)
export async function GET(request) {
  const url = new URL(request.url);
  const challenge = url.searchParams.get('challenge');
  
  if (challenge) {
    return Response.json({ challenge });
  }
  
  return Response.json({ message: "Webhook endpoint active" });
}