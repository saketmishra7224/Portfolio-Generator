# Google Sign-In Setup & Verification Guide

This project uses **Google Identity Services (GIS) — HTML/Button + ID-token flow**.
The frontend obtains a Google-issued **ID token** via Google's official button/popup.
The backend verifies that token server-side and issues the application's existing
**JWT session**. Google passwords are never asked for, stored, or trusted from the client.

## 1. Google Cloud Console configuration (exact steps)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and select (or create) a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Portfolio Generator` (or your product name)
   - User support email: your email
   - Developer contact email: your email
   - Scopes: leave defaults (`email`, `profile`, `openid` are added automatically by GIS)
   - Test users (while in Testing mode): add the Gmail accounts you will test with
   - Save. Status **Testing** is fine for development.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: e.g. `Portfolio Generator Web`
   - **Authorized JavaScript origins** — add every origin that will render the button:
     - `http://localhost:3000` (CRA dev server)
     - `http://localhost:5000` (production server serving the build locally)
     - `https://<your-render-app>.onrender.com` (production)
   - **Authorized redirect URIs**: leave **empty** — this flow uses a popup + ID token,
     not a redirect/code exchange, so no redirect URI and no client secret are needed.
   - Create → copy the **Client ID** (looks like `xxxx.apps.googleusercontent.com`).
4. If Google shows a warning that the app is unverified: expected while the OAuth
   consent screen is in Testing mode — only added test users can sign in.

## 2. Environment variables

No secrets are hardcoded. Do not put secrets in React code.

| Variable | Where | Required | What |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | `server/.env`, Render dashboard, `render.yaml` | Yes for Google auth | OAuth client ID (audience the backend verifies ID tokens against) |
| `REACT_APP_GOOGLE_CLIENT_ID` | `client/.env` (see `client/.env.example`) | Yes for Google button | **Same value** as above; public identifier, exposed to the browser by design |
| `GOOGLE_CLIENT_SECRET` | — | **Not used** | Only needed for an authorization-code flow, which this project does not use |

Email/password auth keeps working when the Google variables are absent: the Google
button shows a disabled state with a helper message, and the backend returns
`GOOGLE_NOT_CONFIGURED` if `POST /api/auth/google` is called without a client ID.

## 3. How it works (architecture)

```
[Browser: official Google button] --popup--> [Google] --ID token--> [Browser]
[Browser] --POST /api/auth/google { idToken }--> [Express backend]
[Backend] verifies via google-auth-library:
  signature (Google JWKS) • expiry • iss ∈ {accounts.google.com,
  https://accounts.google.com} • aud == GOOGLE_CLIENT_ID • email + sub present
[Backend] find-by-googleId → link-by-email → or create user
[Backend] issues existing app JWT (User.generateAuthToken, 7d)
[Browser] stores token in localStorage ('token', 'currentUserEmail')
  → same axios Authorization: Bearer interceptor + GET /api/auth/user refresh flow
```

## 4. Account model & linking strategy

`server/models/User.js` additions (all optional/backwards-compatible):

- `authProvider`: `'local'` (default) or `'google'`
- `googleId`: Google `sub`, unique + sparse (local-only accounts unaffected)
- `emailVerified`: boolean, set from Google's `email_verified` claim
- `password`: now required only for `authProvider !== 'google'`
- `personalInfo.phone`: optional at schema level (Google provides no phone);
  email/password registration still requires phone via route validation

Linking cases in `POST /api/auth/google`:

| Situation | Behaviour |
|---|---|
| New Google account (no googleId, no email match) | Create user (`authProvider: 'google'`, no password, picture → `personalInfo.profileImage`), return app JWT + `isNewUser: true` |
| Existing Google account (googleId match) | Sign in, fill only empty name/picture, adopt changed Gmail only if no other account owns it, else `409 ACCOUNT_CONFLICT` |
| Existing email/password account, same email | **Safe link**: set `googleId`, keep password + all profile data untouched, return JWT + `linked: true`. Both login methods work afterwards |
| Email owned by a *different* Google identity | `409 ACCOUNT_CONFLICT` — never silently merge or overwrite |

Password login for Google-only accounts returns `400 GOOGLE_ACCOUNT` directing the
user to "Continue with Google" (instead of a misleading "invalid password").

## 5. Security notes

- The frontend sends **only** the Google ID token; raw user IDs/emails from the
  client are never trusted for identity.
- Secrets: `JWT_SECRET` stays server-side. `GOOGLE_CLIENT_ID` /
  `REACT_APP_GOOGLE_CLIENT_ID` are public identifiers, not secrets. No client
  secret exists in this flow.
- CORS is unchanged (`server.js`); the Google button loads from
  `https://accounts.google.com/gsi/client` at runtime.
- App JWTs remain 7-day, `Authorization: Bearer`, verified by the unchanged
  `server/middleware/auth.js`.

## 6. Test checklist (all verified in this change unless noted live)

- [x] `npm run build` (client) compiles successfully
- [x] Server module loads; `POST /api/auth/google` route registered
- [x] Mongoose validation: local user without password fails; Google user without
      password passes; existing users (with passwords) still validate
- [ ] Manual — normal registration (email/password, requires phone)
- [ ] Manual — normal login, logout, refresh persistence, protected routes
- [ ] Manual — Google signup (new Gmail): creates account, lands in app, JWT works, refresh persists
- [ ] Manual — Google login (returning): signs in without duplicating the account
- [ ] Manual — linking: Google sign-in with an email that already has a password
      account links it; password login still works afterwards
- [ ] Manual — cancelled popup: form stays, no error shown
- [ ] Manual — offline/blocked GIS: retry state appears
- [ ] Manual — missing env vars: disabled button + `GOOGLE_NOT_CONFIGURED` path
- [ ] Manual — production build served via `npm start`, Google origin allow-listed

To test locally: set `GOOGLE_CLIENT_ID` in `server/.env`, set
`REACT_APP_GOOGLE_CLIENT_ID` in `client/.env`, restart both, and ensure
`http://localhost:3000` (or your dev origin) is in the Cloud Console origins.
