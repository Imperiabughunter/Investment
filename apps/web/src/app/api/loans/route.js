import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's loan applications
    const applications = await sql`
      SELECT * FROM loan_applications 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;

    // Get user's active loans
    const loans = await sql`
      SELECT l.*, la.purpose, la.employment_status, la.monthly_income
      FROM loans l
      JOIN loan_applications la ON l.application_id = la.id
      WHERE l.user_id = ${session.user.id}
      ORDER BY l.created_at DESC
    `;

    return Response.json({ applications, loans });
  } catch (error) {
    console.error("Error fetching loans:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, purpose, employment_status, monthly_income } = await request.json();

    if (!amount || !purpose) {
      return Response.json({ error: "Amount and purpose are required" }, { status: 400 });
    }

    const loanAmount = parseFloat(amount);
    if (loanAmount <= 0) {
      return Response.json({ error: "Loan amount must be positive" }, { status: 400 });
    }

    if (loanAmount < 1000) {
      return Response.json({ error: "Minimum loan amount is $1,000" }, { status: 400 });
    }

    if (loanAmount > 100000) {
      return Response.json({ error: "Maximum loan amount is $100,000" }, { status: 400 });
    }

    // Check user KYC status
    const [user] = await sql`
      SELECT kyc_status, email, first_name, last_name FROM users WHERE id = ${session.user.id}
    `;

    if (!user || user.kyc_status !== 'approved') {
      return Response.json({ error: "KYC approval required to apply for loans" }, { status: 403 });
    }

    // Check for existing pending applications
    const existingApplications = await sql`
      SELECT COUNT(*) as count FROM loan_applications 
      WHERE user_id = ${session.user.id} AND status = 'pending'
    `;

    if (existingApplications[0].count > 0) {
      return Response.json({ error: "You already have a pending loan application" }, { status: 400 });
    }

    // Basic eligibility check (simple example)
    let eligibilityScore = 0;
    if (monthly_income && parseFloat(monthly_income) > 0) {
      const debtToIncomeRatio = (loanAmount * 0.1) / parseFloat(monthly_income); // Assuming 10% monthly payment
      if (debtToIncomeRatio < 0.3) eligibilityScore += 50;
      else if (debtToIncomeRatio < 0.5) eligibilityScore += 25;
    }

    if (employment_status === 'employed') eligibilityScore += 30;
    else if (employment_status === 'self_employed') eligibilityScore += 20;

    if (loanAmount < 10000) eligibilityScore += 20;

    // Create loan application
    const [application] = await sql`
      INSERT INTO loan_applications (
        user_id, amount, purpose, employment_status, monthly_income, status
      ) VALUES (
        ${session.user.id}, ${loanAmount}, ${purpose}, 
        ${employment_status || null}, ${monthly_income || null}, 'pending'
      )
      RETURNING *
    `;

    // Create notification
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        ${session.user.id},
        'Loan Application Submitted',
        'Your loan application for $${loanAmount} has been submitted and is under review.',
        'loan'
      )
    `;

    return Response.json({
      application,
      eligibility_score: eligibilityScore,
      message: eligibilityScore >= 70 ? "High approval likelihood" : 
               eligibilityScore >= 40 ? "Moderate approval likelihood" : 
               "Low approval likelihood - consider improving your profile"
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating loan application:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}