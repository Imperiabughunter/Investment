import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

// Helper function to calculate maturity date
function calculateMaturityDate(durationValue, durationUnit) {
  const now = new Date();
  const maturityDate = new Date(now);
  
  switch (durationUnit) {
    case 'days':
      maturityDate.setDate(now.getDate() + durationValue);
      break;
    case 'weeks':
      maturityDate.setDate(now.getDate() + (durationValue * 7));
      break;
    case 'months':
      maturityDate.setMonth(now.getMonth() + durationValue);
      break;
    case 'years':
      maturityDate.setFullYear(now.getFullYear() + durationValue);
      break;
    default:
      throw new Error('Invalid duration unit');
  }
  
  return maturityDate.toISOString();
}

// Helper function to calculate expected profit with compounding
function calculateExpectedProfit(principal, roiPercentage, durationValue, durationUnit, compoundFrequency) {
  const annualRate = roiPercentage / 100;
  
  // Convert duration to years
  let durationInYears;
  switch (durationUnit) {
    case 'days':
      durationInYears = durationValue / 365;
      break;
    case 'weeks':
      durationInYears = durationValue / 52;
      break;
    case 'months':
      durationInYears = durationValue / 12;
      break;
    case 'years':
      durationInYears = durationValue;
      break;
    default:
      throw new Error('Invalid duration unit');
  }
  
  // Determine compounding frequency per year
  let compoundsPerYear;
  switch (compoundFrequency) {
    case 'daily':
      compoundsPerYear = 365;
      break;
    case 'weekly':
      compoundsPerYear = 52;
      break;
    case 'monthly':
      compoundsPerYear = 12;
      break;
    case 'quarterly':
      compoundsPerYear = 4;
      break;
    case 'yearly':
      compoundsPerYear = 1;
      break;
    default:
      compoundsPerYear = 12; // Default to monthly
  }
  
  // Calculate compound interest: A = P(1 + r/n)^(nt)
  const amount = principal * Math.pow(1 + (annualRate / compoundsPerYear), compoundsPerYear * durationInYears);
  const profit = amount - principal;
  
  return profit;
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const investments = await sql`
      SELECT 
        i.*,
        p.name as plan_name,
        p.description as plan_description,
        p.roi_percentage,
        p.compound_frequency,
        p.duration_value,
        p.duration_unit
      FROM investments i
      JOIN investment_plans p ON i.plan_id = p.id
      WHERE i.user_id = ${session.user.id}
      ORDER BY i.created_at DESC
    `;

    return Response.json({ investments });
  } catch (error) {
    console.error("Error fetching investments:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan_id, amount } = await request.json();

    if (!plan_id || !amount) {
      return Response.json({ error: "Plan ID and amount are required" }, { status: 400 });
    }

    const investmentAmount = parseFloat(amount);
    if (investmentAmount <= 0) {
      return Response.json({ error: "Investment amount must be positive" }, { status: 400 });
    }

    // Check user KYC status
    const [user] = await sql`
      SELECT kyc_status FROM users WHERE id = ${session.user.id}
    `;

    if (!user || user.kyc_status !== 'approved') {
      return Response.json({ error: "KYC approval required to invest" }, { status: 403 });
    }

    // Get investment plan
    const [plan] = await sql`
      SELECT * FROM investment_plans WHERE id = ${plan_id} AND is_active = true
    `;

    if (!plan) {
      return Response.json({ error: "Investment plan not found" }, { status: 404 });
    }

    // Validate investment amount against plan limits
    if (investmentAmount < parseFloat(plan.min_amount)) {
      return Response.json({ 
        error: `Minimum investment amount is $${plan.min_amount}` 
      }, { status: 400 });
    }

    if (investmentAmount > parseFloat(plan.max_amount)) {
      return Response.json({ 
        error: `Maximum investment amount is $${plan.max_amount}` 
      }, { status: 400 });
    }

    // Get user's wallet
    const [wallet] = await sql`
      SELECT * FROM wallets WHERE user_id = ${session.user.id} AND currency = 'USD'
    `;

    if (!wallet) {
      return Response.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Check sufficient balance
    if (parseFloat(wallet.balance) < investmentAmount) {
      return Response.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // Calculate expected profit and maturity date
    const expectedProfit = calculateExpectedProfit(
      investmentAmount,
      parseFloat(plan.roi_percentage),
      parseInt(plan.duration_value),
      plan.duration_unit,
      plan.compound_frequency
    );

    const maturityDate = calculateMaturityDate(
      parseInt(plan.duration_value),
      plan.duration_unit
    );

    // Use SQL transaction to ensure atomicity
    const result = await sql.transaction([
      // Deduct amount from wallet
      sql`
        UPDATE wallets 
        SET balance = balance - ${investmentAmount}, 
            locked_balance = locked_balance + ${investmentAmount},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${session.user.id} AND currency = 'USD'
        RETURNING *
      `,
      
      // Create investment record
      sql`
        INSERT INTO investments (
          user_id, plan_id, amount, expected_profit, maturity_date, start_date
        ) VALUES (
          ${session.user.id}, ${plan_id}, ${investmentAmount}, ${expectedProfit}, 
          ${maturityDate}, CURRENT_TIMESTAMP
        )
        RETURNING *
      `,
      
      // Create transaction record
      sql`
        INSERT INTO transactions (
          user_id, wallet_id, type, amount, balance_before, balance_after,
          description, reference_type, status
        ) VALUES (
          ${session.user.id}, ${wallet.id}, 'investment', ${-investmentAmount},
          ${parseFloat(wallet.balance)}, ${parseFloat(wallet.balance) - investmentAmount},
          'Investment in ${plan.name}', 'investment', 'completed'
        )
        RETURNING *
      `,
      
      // Create notification
      sql`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (
          ${session.user.id},
          'Investment Created',
          'Successfully invested $${investmentAmount} in ${plan.name}. Expected profit: $${expectedProfit.toFixed(2)}',
          'investment'
        )
      `
    ]);

    const [updatedWallet, newInvestment, transaction] = result;

    return Response.json({
      investment: newInvestment[0],
      wallet: updatedWallet[0],
      transaction: transaction[0]
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating investment:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}