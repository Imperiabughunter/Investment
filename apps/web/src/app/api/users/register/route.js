import sql from "@/app/api/utils/sql";

// Simple hash function for demonstration (in production, use proper bcrypt)
async function hashPassword(password) {
  // Using Web Crypto API for password hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'investment-platform-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request) {
  try {
    const { email, password, first_name, last_name, phone } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Password strength validation
    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return Response.json({ error: "User already exists" }, { status: 409 });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, phone)
      VALUES (${email}, ${password_hash}, ${first_name || null}, ${last_name || null}, ${phone || null})
      RETURNING id, email, first_name, last_name, phone, kyc_status, role, created_at
    `;

    // Create default wallet for user
    await sql`
      INSERT INTO wallets (user_id, balance, currency)
      VALUES (${user.id}, 0.00000000, 'USD')
    `;

    // Send welcome notification
    await sql`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (${user.id}, 'Welcome!', 'Welcome to the Investment Platform. Complete your KYC to start investing.', 'system')
    `;

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        kyc_status: user.kyc_status,
        role: user.role,
        created_at: user.created_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}