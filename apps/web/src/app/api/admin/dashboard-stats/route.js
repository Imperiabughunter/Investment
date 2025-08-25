import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const [user] = await sql`
      SELECT role FROM users WHERE id = ${session.user.id}
    `;

    if (!user || user.role !== 'admin') {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get dashboard statistics
    const stats = {};

    // Total users and KYC stats
    const [userStats] = await sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN kyc_status = 'pending' THEN 1 END) as pending_kyc,
        COUNT(CASE WHEN kyc_status = 'approved' THEN 1 END) as approved_kyc
      FROM users 
      WHERE role = 'user'
    `;
    Object.assign(stats, userStats);

    // Investment stats
    const [investmentStats] = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as total_investments,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_investments,
        COUNT(*) as total_investment_count
      FROM investments
    `;
    Object.assign(stats, investmentStats);

    // Loan stats
    const [loanStats] = await sql`
      SELECT 
        COALESCE(SUM(outstanding_balance), 0) as outstanding_loans,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
        COUNT(*) as total_loan_count
      FROM loans
    `;
    Object.assign(stats, loanStats);

    // Daily volume (last 24 hours)
    const [volumeStats] = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as daily_volume
      FROM transactions 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      AND status = 'completed'
    `;
    Object.assign(stats, volumeStats);

    // Recent investments (last 10)
    const recentInvestments = await sql`
      SELECT 
        i.amount,
        i.created_at,
        u.email as user_email,
        p.name as plan_name
      FROM investments i
      JOIN users u ON i.user_id = u.id
      JOIN investment_plans p ON i.plan_id = p.id
      ORDER BY i.created_at DESC
      LIMIT 10
    `;
    stats.recent_investments = recentInvestments;

    // Pending loan applications (last 10)
    const pendingLoans = await sql`
      SELECT 
        la.amount,
        la.purpose,
        la.created_at,
        u.email as user_email
      FROM loan_applications la
      JOIN users u ON la.user_id = u.id
      WHERE la.status = 'pending'
      ORDER BY la.created_at DESC
      LIMIT 10
    `;
    stats.pending_loans = pendingLoans;

    // Recent transactions (last 10)
    const recentTransactions = await sql`
      SELECT 
        t.type,
        t.amount,
        t.created_at,
        t.status,
        u.email as user_email
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `;
    stats.recent_transactions = recentTransactions;

    return Response.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}