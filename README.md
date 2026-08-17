# Dira — School Management System (Frontend)

The web frontend for **Dira**, a modern school ERP platform. This is the client for the
Spring Boot backend that lives in the repository root.

> **Current scope: authentication only.**
> Authentication is the only module implemented on the Java backend, so it is the only
> feature implemented here. No ERP module (students, staff, fees, attendance, exams,
> timetables, reports…) is mocked, stubbed or faked. The architecture is built so those
> modules can be added without redesigning anything.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Backend connection](#backend-connection)
- [Backend requirements (CORS)](#backend-requirements-cors)
- [Authentication architecture](#authentication-architecture)
- [Auth API discovered in the backend](#auth-api-discovered-in-the-backend)
- [Project structure](#project-structure)
- [Design system](#design-system)
- [Commands](#commands)
- [Testing the auth flows](#testing-the-auth-flows)
- [Known limitations](#known-limitations)
- [Adding an ERP module later](#adding-an-erp-module-later)

---

## Tech stack

| Concern          | Choice                                            |
| ---------------- | ------------------------------------------------- |
| Framework        | React 19 + TypeScript (strict)                    |
| Build tool       | Vite 8                                            |
| Styling          | Tailwind CSS v4 (CSS-first `@theme` tokens)       |
| Components       | shadcn/ui pattern on Radix primitives, restyled   |
| Routing          | React Router 7                                    |
| Server state     | TanStack Query 5                                  |
| Forms            | React Hook Form 7                                 |
| Validation       | Zod 4                                             |
| HTTP             | Axios (single configured instance)                |
| Icons            | Lucide React                                      |
| Notifications    | Sonner                                            |
| Fonts            | Inter + Plus Jakarta Sans (self-hosted, Fontsource) |

---

## Quick start

Run the backend and the frontend together. Two terminals:

**Terminal 1 — backend** (from the repository root):

```bash
# Requires Java 21 and a MySQL instance on localhost:3306
./mvnw spring-boot:run          # macOS / Linux
.\mvnw.cmd spring-boot:run      # Windows
```

The backend serves on <http://localhost:8080>.

**Terminal 2 — frontend** (from `frontend/`):

```bash
npm install
cp .env.example .env.local      # copy .env.example .env.local  (Windows)
npm run dev
```

Open <http://localhost:5173>. You will be redirected to `/login`.

Sign in with the seeded administrator created by `DataInitializer`:

| Username    | Password   |
| ----------- | ---------- |
| `mgaschool` | `12345678` |

> Sign in with the **username**, not the email address — see
> [Known limitations](#known-limitations).

---

## Environment variables

Copy `.env.example` to `.env.local` and adjust. **Every `VITE_*` variable is inlined into
the JavaScript bundle and is therefore public — never put a secret in one.**

| Variable                | Default                 | Purpose                                                        |
| ----------------------- | ----------------------- | -------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | `/api`                  | Base URL for the API, **including** the `/api` prefix.          |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | Where the Vite dev server forwards `/api`. Development only.    |
| `VITE_APP_NAME`         | `Dira`                  | Product name in the UI, page titles and brand lockup.          |

All variables are read in exactly one place, [`src/lib/env.ts`](src/lib/env.ts). Nothing
else in the codebase touches `import.meta.env`.

---

## Backend connection

There are two ways to reach the backend. **The default requires no backend changes.**

### 1. Through the Vite dev proxy (default, recommended)

```dotenv
VITE_API_BASE_URL=/api
VITE_DEV_PROXY_TARGET=http://localhost:8080
```

Requests go to `http://localhost:5173/api/...` and Vite forwards them to the backend.
Because the browser only ever talks to its own origin, **CORS never applies**. This
matters: the backend currently has no CORS configuration at all (verified below), so the
direct approach fails without a backend change.

### 2. Directly to the backend

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api
```

This bypasses the proxy and **requires CORS to be enabled on the backend first**.

---

## Backend requirements (CORS)

**No backend code was modified for this task.** For the default proxy setup, none is
needed.

However, a deployed frontend served from a different origin than the API *will* need CORS
on the backend. This is not speculation — the preflight was tested against the running
backend:

```console
$ curl -i -X OPTIONS http://localhost:8080/api/auth/login \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: POST"

HTTP/1.1 403 Forbidden        # ← and no Access-Control-Allow-Origin header
```

If you deploy the frontend on its own origin (and do not put both behind one reverse
proxy), add this to the backend. It is the **only** backend change required, and it adds
CORS without altering any existing behaviour:

```java
// src/main/java/com/lyrt/shule/config/SecurityConfig.java
import java.util.List;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    // Set the real frontend origin(s). Do not use "*" together with credentials.
    config.setAllowedOrigins(List.of("http://localhost:5173"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

…and enable it on the existing filter chain:

```java
http
    .cors(cors -> cors.configurationSource(corsConfigurationSource()))   // add this line
    .csrf(csrf -> csrf.disable())
    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
```

The alternative — and the better production setup — is to serve the built frontend and the
API from a single origin behind nginx, in which case `VITE_API_BASE_URL=/api` works
unchanged and no CORS configuration is required.

---

## Authentication architecture

Authentication is centralised. **No component performs a fetch, reads a token, or touches
storage directly.**

```
      LoginForm / ForgotPasswordForm / ResetPasswordForm   ← UI only
                            │
                     useAuth() hook                        ← the only way in
                            │
                     AuthProvider                          ← owns all session state
                            │
                     auth.service                          ← orchestration
                     ├── auth.api                          ← endpoint bindings
                     └── auth.storage                      ← persistence
                            │
                     api/client (Axios)                    ← base URL, headers, errors
                            │
                     Spring Boot backend
```

| File                                | Responsibility                                                        |
| ----------------------------------- | --------------------------------------------------------------------- |
| `src/auth/auth.types.ts`            | Types mirroring the backend contract exactly                          |
| `src/auth/auth.schemas.ts`          | Zod validation schemas for the three auth forms                       |
| `src/auth/auth.api.ts`              | One-to-one bindings to the backend endpoints                          |
| `src/auth/auth.service.ts`          | Login/logout/restore orchestration and message normalisation          |
| `src/auth/auth.storage.ts`          | Session persistence (`localStorage` vs `sessionStorage`)              |
| `src/auth/auth.context.ts`          | The React context object                                              |
| `src/auth/AuthProvider.tsx`         | Session state, expiry timer, cross-tab sync, API client wiring        |
| `src/auth/useAuth.ts`               | Consumer hook; throws outside the provider                            |

### Token strategy

- The backend returns a **JWT (HS256)** whose only claims are `sub` (username), `iat` and
  `exp`. Lifetime is `app.jwt.expiration` = **86 400 000 ms (24 hours)**.
- The token is attached as `Authorization: Bearer <token>` by a single Axios request
  interceptor. The interceptor obtains the token through a registered provider
  (`setAuthTokenProvider`), so the API layer never imports the auth module — no circular
  dependency, and no token logic scattered across components.
- **Storage** depends on the "Keep me signed in" checkbox:
  - checked → `localStorage`, so the session survives a browser restart;
  - unchecked → `sessionStorage`, so the session dies with the tab.
- **Expiry** is evaluated client-side by decoding the `exp` claim
  ([`src/lib/jwt.ts`](src/lib/jwt.ts)) with a 30-second safety skew. A timer signs the user
  out the instant the token lapses. This is necessary because the backend registers no JWT
  filter and exposes no `/me` endpoint, so a stored token cannot be validated server-side.
- **There is no refresh token** — the backend does not issue one. After 24 hours the user
  signs in again.
- **Logout is client-side only** — the backend has no logout endpoint and keeps no
  server-side session, so signing out discards the stored token.

### Error handling

The backend answers business failures with **HTTP 200** and `success: false`, so status
codes alone are not enough. [`src/api/client.ts`](src/api/client.ts) unwraps the
`ApiResponse` envelope and turns `success: false` into a rejected promise. Every failure
becomes a single normalised `ApiError` with a `kind`:

| `kind`         | Meaning                                     | Shown to the user                                              |
| -------------- | ------------------------------------------- | -------------------------------------------------------------- |
| `business`     | Backend declined it (`success: false`)      | The backend's own curated message                              |
| `offline`      | Browser reports no connectivity             | "You appear to be offline…"                                    |
| `network`      | No response at all (backend down, CORS)     | "We could not reach the Dira server…"                          |
| `timeout`      | Aborted after 20 s                          | "The request took too long…"                                   |
| `unauthorized` | 401/403                                     | "Your session has expired…" (also tears down the session)      |
| `notFound`     | 404                                         | "That feature is unavailable right now…"                       |
| `server`       | 5xx                                         | "Something went wrong on our end…"                             |
| `unknown`      | Malformed body or anything else             | "Something unexpected happened…"                               |

Raw exception text is **never** rendered. Technical detail is preserved on
`ApiError.detail` and logged through [`src/lib/logger.ts`](src/lib/logger.ts), which is
verbose in development and quiet in production.

The one deliberate copy override: the backend's `"Invalid Username or Password"` is
replaced with *"Those details do not match an account. Check your username and password,
then try again."* Any other backend message passes through untouched.

---

## Auth API discovered in the backend

Read from `com.lyrt.shule.auth.AuthController` (`@RequestMapping("/api/auth")`) and
verified against the running server. All three endpoints are implemented in this frontend;
**no other endpoint is called.**

### `POST /api/auth/login`

```jsonc
// request
{ "username": "mgaschool", "password": "12345678" }

// 200 OK — success
{
  "success": true,
  "message": "Login Successful",
  "data": { "token": "eyJhbGciOiJIUzI1NiJ9...", "role": "ROLE_SUPER_ADMIN", "username": "mgaschool" }
}

// 200 OK — failure (note: HTTP 200, not 401)
{ "success": false, "message": "Invalid Username or Password", "data": null }
```

### `POST /api/auth/forgot-password`

```jsonc
{ "email": "ictmgaschools@gmail.com" }
```

Emails a 6-digit code valid for **10 minutes**. Returns `success: false` with
`"Email not found"` for an unknown address.

### `POST /api/auth/reset-password`

```jsonc
{ "email": "…", "code": "123456", "newPassword": "…", "confirmPassword": "…" }
```

`confirmPassword` **is required** — the controller compares it against `newPassword`
before anything else. (The root `Readme.md` omits this field; the code is authoritative.)
Failure messages: `"Passwords do not match"`, `"Invalid reset code"`,
`"Reset code has expired"`, `"User not found"`.

### Endpoints deliberately **not** implemented

- **No registration.** The backend has no public sign-up; accounts are created by
  administrators through `POST /api/staff/register`, which is outside this scope. The login
  page therefore says accounts are issued by your school instead of offering a sign-up link.
- **No social sign-in.** There is no OAuth/OIDC support in the backend, so the Google and
  Microsoft buttons from the original design mockup were intentionally left out rather than
  shipped as dead controls.
- **No logout call.** No such endpoint exists.

---

## Project structure

```
frontend/
├── .env.example
├── components.json                 # shadcn/ui CLI config, for future additions
├── vite.config.ts                  # alias, Tailwind plugin, /api dev proxy
└── src/
    ├── api/
    │   ├── client.ts               # Axios instance, envelope unwrapping, error mapping
    │   ├── endpoints.ts            # every callable route, in one registry
    │   ├── errors.ts               # ApiError + user-facing message resolution
    │   └── types.ts                # ApiResponse envelope types
    ├── auth/                       # see "Authentication architecture" above
    ├── components/
    │   ├── auth/                   # LoginForm, ForgotPasswordForm, ResetPasswordForm
    │   ├── branding/               # DiraMark, DiraWordmark, BrandPanel, BrandGeometry
    │   ├── feedback/               # FullPageLoader
    │   ├── forms/                  # TextField, PasswordField, FieldError
    │   ├── layout/                 # AppHeader, UserMenu
    │   └── ui/                     # design-system primitives (shadcn/ui pattern)
    ├── hooks/                      # useDocumentTitle
    ├── layouts/                    # AuthLayout, AppLayout
    ├── lib/                        # env, logger, jwt, utils
    ├── pages/
    │   ├── app/AppPlaceholderPage.tsx
    │   ├── auth/{Login,ForgotPassword,ResetPassword}Page.tsx
    │   └── NotFoundPage.tsx
    ├── providers/QueryProvider.tsx
    ├── routes/                     # AppRoutes, ProtectedRoute, PublicOnlyRoute, paths
    ├── styles/globals.css          # all design tokens
    ├── App.tsx
    └── main.tsx
```

### Routes

| Path               | Guard        | Purpose                                          |
| ------------------ | ------------ | ------------------------------------------------ |
| `/login`           | public only  | Sign in                                          |
| `/forgot-password` | public only  | Request a reset code                             |
| `/reset-password`  | public only  | Redeem the code and set a new password           |
| `/app`             | protected    | Minimal post-login placeholder (not a dashboard) |
| `*`                | —            | Not found                                        |

`ProtectedRoute` waits for the stored session to be evaluated before deciding, so a page
refresh never bounces an authenticated user to `/login`. It also records the attempted
location and returns the user there after signing in. `PublicOnlyRoute` does the inverse,
keeping signed-in users off the auth screens.

---

## Design system

Every token lives in [`src/styles/globals.css`](src/styles/globals.css). Components
reference semantic names only (`bg-primary`, `text-muted-foreground`, `border-border`), so
the product can be re-themed — including per-school branding later — from that one file.

- **Colour** — deep navy (`#0e1f3d`) for authority and a green (`#23916b`) for direction and
  progress, taken from the Dira brand. Full semantic ramp: background, foreground, card,
  popover, primary, secondary, muted, accent, destructive, success, warning, border, input,
  ring. A coherent dark palette is defined for future use (no toggle is shipped).
- **Typography** — Plus Jakarta Sans for display/headings, Inter for UI and body text, both
  self-hosted via Fontsource (no runtime CDN dependency). A semantic scale is exposed as
  utilities — `type-display`, `type-page-title`, `type-section-title`, `type-heading`,
  `type-body`, `type-label`, `type-caption`, `type-wordmark` — so hierarchy stays consistent
  instead of being re-invented per screen.
- **Radius** — one `--radius` (10px) with derived steps; controls use `rounded-lg`, cards
  `rounded-2xl`.
- **Elevation** — three subtle shadows (`subtle`, `card`, `panel`). Depth is used to lift a
  surface, never for decoration.
- **Focus** — one treatment everywhere: a 2px ring offset from the element, and a 3px ring
  plus a colour shift on inputs.
- **Motion** — restrained. A short entrance on page and card mount, colour/shadow
  transitions on interaction, and a button spinner. Nothing loops or moves on its own.

### Accessibility

- Every input has a real `<label>` bound with `htmlFor`/`id`.
- Validation errors use `role="alert"` and are wired to their input via `aria-describedby`,
  with `aria-invalid` set.
- Async outcomes sit in an `aria-live="polite"` region so they are announced without
  stealing focus.
- The whole sign-in flow is keyboard-operable; tab order is
  username → password → keep-signed-in → forgot-password → submit. The reset link is placed
  *after* the password field in the DOM specifically so it does not interrupt the credential
  fields.
- Visible focus on every interactive element; touch targets are 44px on controls.
- Buttons expose `aria-busy` while loading; the password toggle exposes `aria-pressed`.

---

## Commands

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Dev server with HMR on port 5173          |
| `npm run typecheck` | TypeScript, strict, no emit               |
| `npm run lint`      | oxlint                                    |
| `npm run lint:fix`  | oxlint with autofix                       |
| `npm run build`     | Typecheck then production build to `dist/` |
| `npm run preview`   | Serve the production build locally        |

Production build:

```bash
npm run build        # emits dist/
```

`dist/` is a static bundle; serve it from any static host or reverse proxy. If the API is
on another origin, set `VITE_API_BASE_URL` **at build time** (Vite inlines it) and make sure
[CORS](#backend-requirements-cors) is configured.

---

## Testing the auth flows

Each of these was exercised against the running backend.

| Scenario                       | How to reproduce                                        | Expected                                                                 |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| Successful login               | `mgaschool` / `12345678`                                | Redirect to `/app`, toast, user + role + expiry shown                     |
| Invalid credentials            | Any wrong password                                      | Inline error alert, password cleared and refocused, no redirect           |
| Empty fields                   | Submit the empty form                                   | Per-field messages; no request is sent                                    |
| Backend unavailable            | Stop the backend, then sign in                          | "We could not reach the Dira server…"                                    |
| Offline                        | DevTools → Network → Offline                            | "You appear to be offline…"                                              |
| Refresh while authenticated    | Reload on `/app`                                        | Stays on `/app`; no flash of the login screen                            |
| Protected route, signed out    | Visit `/app` signed out                                 | Redirect to `/login`, then back to `/app` after signing in               |
| Auth route, signed in          | Visit `/login` signed in                                | Redirect to `/app`                                                       |
| Logout                         | Account menu → Sign out                                 | Token cleared from storage, redirect to `/login`                         |
| Session expiry                 | Edit the stored `exp` to the past, reload               | Session discarded; login shows "Your session has expired for security."   |
| Duplicate submit               | Click Sign in repeatedly                                | Button disables and shows a spinner; exactly one request                  |
| Keyboard only                  | Tab, type, Tab, type, Enter                             | Signs in without a mouse                                                 |
| Password reveal                | Click the eye icon                                      | Toggles `type` between `password` and `text`                              |
| Forgot password                | Submit a known address                                  | Code emailed, continues to `/reset-password` with the address prefilled   |
| Reset password                 | Enter code + matching passwords                         | Success toast, redirect to `/login`                                       |
| Responsive                     | 390 / 834 / 1440 px                                     | Brand panel hidden below `lg`; form centred with a compact brand header   |

---

## Known limitations

These are properties of the **current backend**, documented rather than worked around.

1. **Login is by username, not email.** `AuthController.login` resolves accounts with
   `userRepo.findByUsername(...)`, so an email address will not authenticate even though the
   seeded admin has one. The field is labelled "Username" accordingly — this intentionally
   differs from the design mockup, which said "Email address". `forgot-password` and
   `reset-password`, by contrast, key off **email**. Making login accept either requires a
   backend change (e.g. falling back to `findByEmail`).
2. **Failed logins return HTTP 200.** Handled by unwrapping the envelope, but it means
   generic HTTP tooling and proxies cannot distinguish success from failure.
3. **No refresh token.** Sessions end hard at 24 hours.
4. **No server-side token validation.** `SecurityConfig` is `anyRequest().permitAll()` and
   registers no JWT filter, so the bearer token is not actually enforced on any endpoint —
   only `SystemController` parses it manually for its super-admin check. A stored token
   cannot be verified, so the frontend can only check `exp` locally. **Real route protection
   must be added on the backend before any ERP module ships.**
5. **No `/me` endpoint.** Username and role are persisted from the login response, since
   there is no way to re-fetch the current user.
6. **Token is stored in Web Storage**, which is readable by any script on the origin and so
   exposed to XSS. This is forced by the backend's design: it returns a bearer token in the
   response body and sets no cookie. The robust fix is a backend change — issue an
   `HttpOnly; Secure; SameSite` cookie instead.
7. **Role is not a JWT claim.** It arrives only in the login response body, so it is
   advisory on the client. Any real authorisation must be enforced server-side.
8. **User enumeration.** `forgot-password` replies `"Email not found"` for unknown
   addresses, which lets an attacker discover registered emails. Returning a neutral message
   would be a backend change.
9. **`reset-password` can throw on malformed input.** The controller calls
   `newPassword.equals(confirmPassword)` before any null check, so omitting `newPassword`
   causes a `NullPointerException`. This frontend always sends both fields, so it does not
   trigger it.
10. **Secrets are committed to the backend repository.** `src/main/resources/application.properties`
    contains a hard-coded JWT signing secret (`app.jwt.secret`) and a Gmail app password
    (`spring.mail.password`). Both are in git history and should be **rotated and moved to
    environment variables**. Nothing secret is stored in this frontend.

---

## Adding an ERP module later

Nothing here needs redesigning to add, say, students:

1. Add the routes to `src/routes/paths.ts`.
2. Add the verified backend routes to `src/api/endpoints.ts`.
3. Create `src/features/students/` with `students.api.ts`, `students.types.ts`, its schemas
   and components — mirroring the shape of `src/auth/`.
4. Register the pages as children of the protected `AppLayout` branch in
   `src/routes/AppRoutes.tsx`; they inherit the guard, header and page shell.
5. Build the UI from `src/components/ui` so it matches the design system automatically.

The API client, auth headers, error normalisation, toasts, design tokens, layouts and route
guards are all already in place and shared.
