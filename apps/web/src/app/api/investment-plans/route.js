import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const plans = await sql`
      SELECT * FROM investment_plans 
      WHERE is_active = true 
      ORDER BY min_amount ASC
    `;

    return Response.json({ plans });
  } catch (error) {
    console.error("Error fetching investment plans:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
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

    const {
      name,
      description,
      min_amount,
      max_amount,
      roi_percentage,
      duration_value,
      duration_unit,
      compound_frequency
    } = await request.json();

    // Validate required fields
    if (!name || !min_amount || !max_amount || !roi_percentage || !duration_value || !duration_unit) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate amounts
    if (parseFloat(min_amount) <= 0 || parseFloat(max_amount) <= 0) {
      return Response.json({ error: "Amounts must be positive" }, { status: 400 });
    }

    if (parseFloat(min_amount) > parseFloat(max_amount)) {
      return Response.json({ error: "Minimum amount cannot be greater than maximum amount" }, { status: 400 });
    }

    // Validate ROI
    if (parseFloat(roi_percentage) <= 0) {
      return Response.json({ error: "ROI percentage must be positive" }, { status: 400 });
    }

    // Validate duration
    if (parseInt(duration_value) <= 0) {
      return Response.json({ error: "Duration value must be positive" }, { status: 400 });
    }

    const validDurationUnits = ['days', 'weeks', 'months', 'years'];
    if (!validDurationUnits.includes(duration_unit)) {
      return Response.json({ error: "Invalid duration unit" }, { status: 400 });
    }

    const validCompoundFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    if (compound_frequency && !validCompoundFrequencies.includes(compound_frequency)) {
      return Response.json({ error: "Invalid compound frequency" }, { status: 400 });
    }

    const [newPlan] = await sql`
      INSERT INTO investment_plans (
        name, description, min_amount, max_amount, roi_percentage,
        duration_value, duration_unit, compound_frequency
      ) VALUES (
        ${name}, ${description || null}, ${min_amount}, ${max_amount}, ${roi_percentage},
        ${duration_value}, ${duration_unit}, ${compound_frequency || 'monthly'}
      )
      RETURNING *
    `;

    return Response.json({ plan: newPlan }, { status: 201 });
  } catch (error) {
    console.error("Error creating investment plan:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}