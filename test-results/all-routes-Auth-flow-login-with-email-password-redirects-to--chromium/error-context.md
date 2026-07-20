# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: all-routes.spec.ts >> Auth flow >> login with email/password redirects to /
- Location: e2e/all-routes.spec.ts:145:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Welcome back" [level=1] [ref=e6]
      - paragraph [ref=e7]: Sign in to continue
    - alert [ref=e8]:
      - img [ref=e9]
      - paragraph [ref=e11]: Failed to fetch
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Email
        - textbox "Email" [ref=e15]:
          - /placeholder: you@example.com
          - text: test@r6hub.test
      - generic [ref=e16]:
        - generic [ref=e17]: Password
        - generic [ref=e18]:
          - textbox "Password" [ref=e19]:
            - /placeholder: Enter your password
            - text: Test123!
          - button "Show password" [ref=e20]:
            - img [ref=e21]
      - button "Sign In" [ref=e24]
    - generic [ref=e27]: or
    - button "Continue with Discord" [ref=e29]:
      - generic [ref=e30]:
        - img
        - text: Continue with Discord
    - paragraph [ref=e31]:
      - text: Don't have an account?
      - link "Sign up" [ref=e32] [cursor=pointer]:
        - /url: /signup
  - generic [ref=e37] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e38]:
      - img [ref=e39]
    - generic [ref=e42]:
      - button "Open issues overlay" [ref=e43]:
        - generic [ref=e44]:
          - generic [ref=e45]: "1"
          - generic [ref=e46]: "2"
        - generic [ref=e47]:
          - text: Issue
          - generic [ref=e48]: s
      - button "Collapse issues badge" [ref=e49]:
        - img [ref=e50]
  - alert [ref=e52]
  - alert [ref=e53]:
    - generic [ref=e57]:
      - paragraph [ref=e58]:
        - text: Utilizziamo cookie per migliorare la tua esperienza. Leggi la nostra
        - link "Cookie Policy" [ref=e59] [cursor=pointer]:
          - /url: /cookies
        - text: .
      - generic [ref=e60]:
        - button "Rifiuta tutti i cookie" [ref=e61]: Rifiuta tutti
        - button "Personalizza preferenze cookie" [ref=e62]: Personalizza
        - button "Accetta tutti i cookie" [ref=e63]: Accetta tutti
```

# Test source

```ts
  50  |   if (errors.length > 0) console.log(`  ⚠ console:${url}`, errors);
  51  | 
  52  |   const critical = errors.filter(
  53  |     (e) =>
  54  |       !e.includes("favicon") &&
  55  |       !e.includes("Failed to load") &&
  56  |       !e.includes("net::ERR_ABORTED") &&
  57  |       !e.includes("Mixed Content"),
  58  |   );
  59  |   if (!options?.skipCriticalErrorCheck) {
  60  |     expect(critical, `No runtime errors on ${url}`).toEqual([]);
  61  |   }
  62  | 
  63  |   if (options?.expectHeading) {
  64  |     await expect(page.getByRole("heading", { name: options.expectHeading }).first()).toBeVisible();
  65  |   }
  66  |   if (options?.expectUrl) {
  67  |     await expect(page).toHaveURL(options.expectUrl);
  68  |   }
  69  | 
  70  |   await page.screenshot({
  71  |     path: `e2e/screenshots/${url.replace(/[^a-z0-9]/gi, "_")}.png`,
  72  |     fullPage: true,
  73  |   });
  74  | }
  75  | 
  76  | // ── Login helper — logs in via Supabase SDK and seeds cookies ─
  77  | 
  78  | async function loginViaAPI(page: Page) {
  79  |   await page.goto("/login", { waitUntil: "networkidle" });
  80  |   await page.fill('input[type="email"]', TEST_USER.email);
  81  |   await page.fill('input[type="password"]', TEST_USER.password);
  82  |   await page.click('button[type="submit"]');
  83  |   // Wait for redirect to home
  84  |   await page.waitForURL(/\/$/, { timeout: 20000 });
  85  | }
  86  | 
  87  | // ── Global setup: login once, save storage ───────────────────
  88  | 
  89  | test.describe.configure({ mode: "serial" });
  90  | 
  91  | test.describe("Public pages", () => {
  92  |   test.beforeEach(async ({ context }) => {
  93  |     await context.clearCookies();
  94  |   });
  95  | 
  96  |   test("/login", async ({ page }) => {
  97  |     await checkPage(page, "/login", {
  98  |       expectHeading: /welcome back/i,
  99  |     });
  100 |   });
  101 | 
  102 |   test("/signup", async ({ page }) => {
  103 |     await checkPage(page, "/signup", {
  104 |       expectHeading: /create account|sign up/i,
  105 |     });
  106 |   });
  107 | 
  108 |   test("/privacy", async ({ page }) => {
  109 |     await checkPage(page, "/privacy", {
  110 |       skipCriticalErrorCheck: true,
  111 |     });
  112 |   });
  113 | 
  114 |   test("/terms", async ({ page }) => {
  115 |     await checkPage(page, "/terms", {
  116 |       skipCriticalErrorCheck: true,
  117 |     });
  118 |   });
  119 | 
  120 |   test("/cookies", async ({ page }) => {
  121 |     await checkPage(page, "/cookies", {
  122 |       skipCriticalErrorCheck: true,
  123 |     });
  124 |   });
  125 | 
  126 |   test("/validate (no params = error state)", async ({ page }) => {
  127 |     await checkPage(page, "/validate", {
  128 |       skipCriticalErrorCheck: true,
  129 |     });
  130 |   });
  131 | 
  132 |   test("/settings/cookies (public)", async ({ page }) => {
  133 |     await checkPage(page, "/settings/cookies", {
  134 |       skipCriticalErrorCheck: true,
  135 |     });
  136 |   });
  137 | 
  138 |   test("redirects / → /login when unauthenticated", async ({ page }) => {
  139 |     await page.goto("/", { waitUntil: "networkidle" });
  140 |     await expect(page).toHaveURL(/\/login/);
  141 |   });
  142 | });
  143 | 
  144 | test.describe("Auth flow", () => {
  145 |   test("login with email/password redirects to /", async ({ page }) => {
  146 |     await page.goto("/login");
  147 |     await page.fill('input[type="email"]', TEST_USER.email);
  148 |     await page.fill('input[type="password"]', TEST_USER.password);
  149 |     await page.click('button[type="submit"]');
> 150 |     await page.waitForURL(/\/$/, { timeout: 20000 });
      |                ^ TimeoutError: page.waitForURL: Timeout 20000ms exceeded.
  151 |     expect(page.url()).toBe("http://localhost:3000/");
  152 |   });
  153 | });
  154 | 
  155 | test.describe("Authenticated pages", () => {
  156 |   test.beforeEach(async ({ page }) => {
  157 |     await loginViaAPI(page);
  158 |   });
  159 | 
  160 |   test("/ — home/landing", async ({ page }) => {
  161 |     await checkPage(page, "/", {
  162 |       skipCriticalErrorCheck: true, // might need lobby data
  163 |     });
  164 |   });
  165 | 
  166 |   test("/tasks", async ({ page }) => {
  167 |     await checkPage(page, "/tasks", {
  168 |       skipCriticalErrorCheck: true,
  169 |     });
  170 |   });
  171 | 
  172 |   test("/submit", async ({ page }) => {
  173 |     await checkPage(page, "/submit", {
  174 |       skipCriticalErrorCheck: true,
  175 |     });
  176 |   });
  177 | 
  178 |   test("/settings/account", async ({ page }) => {
  179 |     await checkPage(page, "/settings/account", {
  180 |       skipCriticalErrorCheck: true,
  181 |     });
  182 |   });
  183 | 
  184 |   test("lobby page - /lobby/TESTOP", async ({ page }) => {
  185 |     await checkPage(page, "/lobby/TESTOP", {
  186 |       skipCriticalErrorCheck: true,
  187 |     });
  188 |   });
  189 | 
  190 |   test("lobby map selection - /lobby/TESTOP/map", async ({ page }) => {
  191 |     await checkPage(page, "/lobby/TESTOP/map", {
  192 |       skipCriticalErrorCheck: true,
  193 |     });
  194 |   });
  195 | 
  196 |   test("lobby bans - /lobby/TESTOP/bans", async ({ page }) => {
  197 |     await checkPage(page, "/lobby/TESTOP/bans", {
  198 |       skipCriticalErrorCheck: true,
  199 |     });
  200 |   });
  201 | 
  202 |   test("lobby select - /lobby/TESTOP/select", async ({ page }) => {
  203 |     await checkPage(page, "/lobby/TESTOP/select", {
  204 |       skipCriticalErrorCheck: true,
  205 |     });
  206 |   });
  207 | 
  208 |   test("lobby tasks - /lobby/TESTOP/tasks", async ({ page }) => {
  209 |     await checkPage(page, "/lobby/TESTOP/tasks", {
  210 |       skipCriticalErrorCheck: true,
  211 |     });
  212 |   });
  213 | });
  214 | 
  215 | test.describe("API", () => {
  216 |   test("GET /api/health", async ({ page }) => {
  217 |     const resp = await page.goto("/api/health");
  218 |     expect(resp?.ok()).toBeTruthy();
  219 |     const body = await resp?.json();
  220 |     expect(body?.status).toBe("ok");
  221 |   });
  222 | });
  223 | 
```