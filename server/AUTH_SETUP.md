# Authentication Setup - Session 11

## Overview

Session 11 implements OAuth2-based authentication with support for multiple providers:
- **Email/Password** (foundation for custom auth)
- **Google OAuth**
- **Discord OAuth**

All authentication is handled via Cloudflare Workers with JWT-based session management.

## Installation

The following packages have been installed:
- `jsonwebtoken` - JWT token creation and validation
- `jwt-decode` - JWT decoding utilities
- `google-auth-library` - Google OAuth helper library

```bash
pnpm add -w jsonwebtoken jwt-decode google-auth-library
```

## Architecture

### Backend (Cloudflare Workers)

**Authentication Modules:**
- `src/auth/config.ts` - OAuth provider configuration
- `src/auth/oauth.ts` - OAuth2 flow utilities
- `src/auth/jwt.ts` - JWT token management

**Authentication Routes:**
- `src/routes/auth.ts` - OAuth handlers

### Frontend (React)

Login UI components and OAuth callbacks (to be implemented in Session 13)

## API Endpoints

### Authentication Endpoints

#### GET `/auth/google`
Redirect to Google OAuth login page.

**Response:** 302 redirect to Google sign-in

```bash
curl http://localhost:8787/auth/google
```

#### GET `/auth/discord`
Redirect to Discord OAuth login page.

**Response:** 302 redirect to Discord sign-in

```bash
curl http://localhost:8787/auth/discord
```

#### GET `/auth/callback/google`
Google OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - CSRF protection token

**Response:** 302 redirect to `/dashboard` with session cookie

#### GET `/auth/callback/discord`
Discord OAuth callback handler.

**Query Parameters:**
- `code` - Authorization code from Discord
- `state` - CSRF protection token

**Response:** 302 redirect to `/dashboard` with session cookie

#### GET `/auth/logout`
Clear session and redirect to home.

**Response:** 302 redirect to `/` with cleared session cookie

```bash
curl -b "session=TOKEN" http://localhost:8787/auth/logout
```

#### GET `/auth/me`
Get current authenticated user information.

**Headers:**
- `Authorization: Bearer <token>` or `Cookie: session=<token>`

**Response (200):**
```json
{
  "userId": "user-uuid",
  "email": "user@example.com",
  "username": "display_name",
  "iat": 1699500000,
  "exp": 1699586400
}
```

## Environment Variables

Configure these in your `wrangler.toml` or `.env.local`:

```toml
# Email authentication
AUTH_EMAIL_ENABLED = "false"

# Google OAuth
AUTH_GOOGLE_ENABLED = "true"
AUTH_GOOGLE_CLIENT_ID = "your-google-client-id.apps.googleusercontent.com"
AUTH_GOOGLE_CLIENT_SECRET = "your-google-client-secret"
AUTH_GOOGLE_REDIRECT_URI = "http://localhost:8787/auth/callback/google"

# Discord OAuth
AUTH_DISCORD_ENABLED = "true"
AUTH_DISCORD_CLIENT_ID = "your-discord-client-id"
AUTH_DISCORD_CLIENT_SECRET = "your-discord-client-secret"
AUTH_DISCORD_REDIRECT_URI = "http://localhost:8787/auth/callback/discord"

# JWT Configuration
JWT_SECRET = "your-super-secret-key-change-in-production"
JWT_EXPIRES_IN = "86400"  # 24 hours in seconds
SESSION_EXPIRES_IN = "2592000"  # 30 days in seconds
```

## OAuth Provider Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:8787/auth/callback/google`
   - `https://yourdomain.com/auth/callback/google`
6. Copy Client ID and Client Secret

### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 section
4. Add redirect URLs:
   - `http://localhost:8787/auth/callback/discord`
   - `https://yourdomain.com/auth/callback/discord`
5. Copy Client ID and Client Secret from General Information

## Session Management

### Token Creation

When a user authenticates, a JWT token is created with:
- `userId` - Unique user identifier
- `email` - User email address
- `username` - Display name
- `iat` - Token creation time
- `exp` - Token expiration time

```typescript
const payload: JWTPayload = {
  userId: user.id,
  email: user.email,
  username: user.username,
  iat: Math.floor(Date.now() / 1000),
  exp: getTokenExpiration(86400), // 24 hours
}

const token = createToken(payload, secret)
```

### Cookies

Session tokens are stored in HTTP-only cookies with:
- `HttpOnly` - Prevents JavaScript access
- `SameSite=Strict` - CSRF protection
- Secure (production only) - Requires HTTPS
- Expiration matching session length

```
Set-Cookie: session=<jwt-token>; Expires=...; Path=/; HttpOnly; SameSite=Strict
```

## User Creation & Linking

When a user authenticates with OAuth:

1. Extract user info from OAuth provider
2. Check if user exists in database by email
3. If not, create new user:
   ```sql
   INSERT INTO users (id, email, username)
   VALUES ('user_id', 'email@example.com', 'username')
   ```
4. Create and return session token

## Security Considerations

1. **JWT Secret** - Use strong, randomly generated secret in production
2. **HTTPS** - Always use HTTPS in production
3. **PKCE** - Implement Proof Key for Code Exchange for mobile apps
4. **State** - Verify OAuth state parameter to prevent CSRF
5. **Token Rotation** - Consider implementing refresh tokens for longer sessions

## Testing

### Local Development

Start the development server:
```bash
cd server
pnpm dev
```

Test Google login:
```bash
curl http://localhost:8787/auth/google
```

Test Discord login:
```bash
curl http://localhost:8787/auth/discord
```

### Production

Deploy to Cloudflare:
```bash
cd server
pnpm deploy
```

Set production environment variables in Cloudflare Workers settings.

## Next Steps (Session 12)

- Create D1 user mapping table for OAuth provider links
- Store OAuth IDs (Google, Discord) in database for account linking
- Allow users to link multiple OAuth accounts

## Next Steps (Session 13)

- Create React login page component
- Add Google/Discord OAuth buttons
- Implement email/password form
- Handle OAuth callback redirect

## Known Limitations

- Email authentication not yet implemented (foundation only)
- JWT signature verification simplified for Cloudflare Workers edge runtime
- PKCE flow not implemented yet
- Token refresh not yet implemented
- Account linking not yet implemented

## Resources

- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Discord OAuth Documentation](https://discord.com/developers/docs/topics/oauth2)
- [JWT Introduction](https://jwt.io/introduction)
