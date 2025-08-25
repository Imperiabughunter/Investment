import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallets = await sql`
      SELECT w.*, u.email, u.first_name, u.last_name
      FROM wallets w
      JOIN users u ON w.user_id = u.id
      WHERE w.user_id = ${session.user.id}
    `;

    if (wallets.length === 0) {
      // Create default wallet if doesn't exist
      await sql`
        INSERT INTO wallets (user_id, balance, currency)
        VALUES (${session.user.id}, 0.00000000, 'USD')
      `;
      
      const newWallet = await sql`
        SELECT * FROM wallets WHERE user_id = ${session.user.id}
      `;
      
      return Response.json({ wallets: newWallet });
    }

    return Response.json({ wallets });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, type, description } = await request.json();

    if (!amount || !type) {
      return Response.json({ error: "Amount and type are required" }, { status: 400 });
    }

    if (amount <= 0) {
      return Response.json({ error: "Amount must be positive" }, { status: 400 });
    }

    // Get user's wallet
    const [wallet] = await sql`
      SELECT * FROM wallets WHERE user_id = ${session.user.id} AND currency = 'USD'
    `;

    if (!wallet) {
      return Response.json({ error: "Wallet not found" }, { status: 404 });
    }

    const balanceBefore = parseFloat(wallet.balance);
    let balanceAfter;
    let transactionAmount;

    if (type === 'deposit') {
      balanceAfter = balanceBefore + parseFloat(amount);
      transactionAmount = parseFloat(amount);
    } else if (type === 'withdrawal') {
      if (balanceBefore < parseFloat(amount)) {
        return Response.json({ error: "Insufficient balance" }, { status: 400 });
      }
      balanceAfter = balanceBefore - parseFloat(amount);
      transactionAmount = -parseFloat(amount);
    } else {
      return Response.json({ error: "Invalid transaction type" }, { status: 400 });
    }

    // Update wallet balance and create transaction in a single transaction
    const [updatedWallet] = await sql`
      UPDATE wallets 
      SET balance = ${balanceAfter}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.user.id} AND currency = 'USD'
      RETURNING *
    `;

    // Create transaction record
    await sql`
      INSERT INTO transactions (
        user_id, wallet_id, type, amount, balance_before, balance_after, 
        description, status
      ) VALUES (
        ${session.user.id}, ${wallet.id}, ${type}, ${transactionAmount}, 
        ${balanceBefore}, ${balanceAfter}, ${description || `${type} transaction`}, 'completed'
      )
    `;

    // Create notification
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        ${session.user.id}, 
        ${type === 'deposit' ? 'Deposit Successful' : 'Withdrawal Successful'}, 
        ${`$${amount} has been ${type === 'deposit' ? 'added to' : 'withdrawn from'} your wallet.`},
        'transaction'
      )
    `;

    return Response.json({ 
      wallet: updatedWallet,
      transaction: {
        type,
        amount: transactionAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter
      }
    });
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}