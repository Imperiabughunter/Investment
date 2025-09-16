/**
 * Full adapter implementation that will be lazy-loaded
 * This helps prevent the 'transport invoke timed out' error in Vite
 */

import type {
  AdapterUser,
  VerificationToken,
  Adapter,
  AdapterSession,
} from '@auth/core/adapters';
import type { ProviderType } from '@auth/core/providers';
import type { Pool } from '@neondatabase/serverless';

interface NeonUser extends AdapterUser {
  accounts: {
    provider: string;
    provider_account_id: string;
    password?: string;
  }[];
}

interface NeonAdapter extends Adapter {
  createUser(data: AdapterUser): Promise<AdapterUser>;
  getUser(userId: string): Promise<AdapterUser | null>;
  getUserByEmail(email: string): Promise<NeonUser | null>;
  getUserByAccount(data: {
    provider: string;
    providerAccountId: string;
  }): Promise<AdapterUser | null>;
  linkAccount(data: {
    userId: string;
    provider: string;
    providerAccountId: string;
    type: ProviderType;
    access_token?: string | null;
    expires_at?: number | null;
    refresh_token?: string | null;
    id_token?: string | null;
    scope?: string | null;
    session_state?: string | null;
    token_type?: string | null;
    extraData?: Record<string, unknown>;
  }): Promise<void>;
}

export default function getFullAdapter(client: Pool): NeonAdapter {
  return {
    async createVerificationToken(
      verificationToken: VerificationToken
    ): Promise<VerificationToken> {
      const { identifier, expires, token } = verificationToken;
      const sql = `
        INSERT INTO auth_verification_token ( identifier, expires, token )
        VALUES ($1, $2, $3)
        `;
      await client.query(sql, [identifier, expires, token]);
      return verificationToken;
    },
    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken | null> {
      const sql = `delete from auth_verification_token
      where identifier = $1 and token = $2
      RETURNING identifier, expires, token `;
      const result = await client.query(sql, [identifier, token]);
      return result.rowCount !== 0 ? result.rows[0] : null;
    },

    async createUser(user: Omit<AdapterUser, 'id'>) {
      const { name, email, emailVerified, image } = user;
      const sql = `
        INSERT INTO auth_users (name, email, "emailVerified", image)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, "emailVerified", image`;
      const result = await client.query(sql, [
        name,
        email,
        emailVerified,
        image,
      ]);
      return result.rows[0];
    },
    async getUser(id: string) {
      const sql = 'select * from auth_users where id = $1';
      try {
        const result = await client.query(sql, [id]);
        return result.rowCount === 0 ? null : result.rows[0];
      } catch {
        return null;
      }
    },
    async getUserByEmail(email) {
      const sql = 'select * from auth_users where email = $1';
      const result = await client.query(sql, [email]);
      if (result.rowCount === 0) {
        return null;
      }
      const userData = result.rows[0];
      const accountsData = await client.query(
        'select * from auth_accounts where "providerAccountId" = $1',
        [userData.id]
      );
      return {
        ...userData,
        accounts: accountsData.rows.map((account) => ({
          provider: account.provider,
          provider_account_id: account.providerAccountId,
          password: account.password,
        })),
      };
    },
    async getUserByAccount({
      provider,
      providerAccountId,
    }) {
      const sql = `
        select u.* from auth_users u join auth_accounts a on u.id = a."userId"
        where a.provider = $1 and a."providerAccountId" = $2`;
      const result = await client.query(sql, [provider, providerAccountId]);
      return result.rowCount === 0 ? null : result.rows[0];
    },
    async updateUser(user) {
      const { id, name, email, emailVerified, image } = user;
      const sql = `
        UPDATE auth_users
        SET name = $2, email = $3, "emailVerified" = $4, image = $5
        WHERE id = $1
        RETURNING id, name, email, "emailVerified", image
      `;
      const result = await client.query(sql, [
        id,
        name,
        email,
        emailVerified,
        image,
      ]);
      return result.rows[0];
    },
    async linkAccount(account) {
      const {
        userId,
        provider,
        providerAccountId,
        type,
        access_token,
        expires_at,
        refresh_token,
        id_token,
        scope,
        session_state,
        token_type,
      } = account;

      const sql = `
        INSERT INTO auth_accounts (
          "userId", provider, "providerAccountId", type, 
          "access_token", "expires_at", "refresh_token", "id_token", 
          scope, "session_state", "token_type"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;

      await client.query(sql, [
        userId,
        provider,
        providerAccountId,
        type,
        access_token,
        expires_at,
        refresh_token,
        id_token,
        scope,
        session_state,
        token_type,
      ]);
    },
    async createSession({ sessionToken, userId, expires }) {
      const sql = `
        INSERT INTO auth_sessions ("sessionToken", "userId", expires)
        VALUES ($1, $2, $3)
        RETURNING id, "sessionToken", "userId", expires
      `;
      const result = await client.query(sql, [sessionToken, userId, expires]);
      return result.rows[0];
    },
    async getSessionAndUser(sessionToken) {
      const sql = `
        SELECT s.id as session_id, s."userId" as session_user_id, s.expires as session_expires,
               u.id as user_id, u.name, u.email, u."emailVerified", u.image
        FROM auth_sessions s
        JOIN auth_users u ON s."userId" = u.id
        WHERE s."sessionToken" = $1
      `;
      const result = await client.query(sql, [sessionToken]);
      if (result.rowCount === 0) return null;
      const { session_id, session_user_id, session_expires, ...userData } =
        result.rows[0];
      const session = {
        id: session_id,
        sessionToken,
        userId: session_user_id,
        expires: session_expires,
      };
      const user = {
        id: userData.user_id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image,
      };
      return { session, user };
    },
    async updateSession(session) {
      const { sessionToken, userId, expires } = session;
      const sql = `
        UPDATE auth_sessions
        SET "userId" = $2, expires = $3
        WHERE "sessionToken" = $1
        RETURNING id, "sessionToken", "userId", expires
      `;
      const result = await client.query(sql, [sessionToken, userId, expires]);
      return result.rows[0];
    },
    async deleteSession(sessionToken) {
      const sql = `DELETE FROM auth_sessions WHERE "sessionToken" = $1`;
      await client.query(sql, [sessionToken]);
    },
    async unlinkAccount({ provider, providerAccountId }) {
      const sql = `
        DELETE FROM auth_accounts
        WHERE provider = $1 AND "providerAccountId" = $2
      `;
      await client.query(sql, [provider, providerAccountId]);
    },
    async deleteUser(userId) {
      await client.query('BEGIN');
      try {
        await client.query('DELETE FROM auth_accounts WHERE "userId" = $1', [
          userId,
        ]);
        await client.query('DELETE FROM auth_sessions WHERE "userId" = $1', [
          userId,
        ]);
        await client.query('DELETE FROM auth_users WHERE id = $1', [userId]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    },
  };
}