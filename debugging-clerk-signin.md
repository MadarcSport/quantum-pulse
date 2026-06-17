# Beginner Debugging Guide: Clerk Sign-In Bug

This guide explains how to debug a real bug step by step, using today's Clerk sign-in problem as the example.

The goal is not only to fix one bug. The goal is to learn **how to think like a debugger**.

---

## 1. The Bug We Started With

The first visible error was:

```txt
useSession can only be used within the <ClerkProvider /> component
```

This happened when clicking the **Sign in** button.

In plain English, Clerk was saying:

> A Clerk component or hook is being used, but React cannot find the parent `<ClerkProvider>` around it.

That is like trying to use Wi-Fi before the router is plugged in.

---

## 2. The First Debugging Rule: Read the Error Literally

A beginner mistake is to panic and change many files at once.

A better first step is to ask:

> What exactly is the error saying?

The error said:

```txt
useSession can only be used within the <ClerkProvider /> component
```

So we should immediately search for two things:

1. Where is `<ClerkProvider>` used?
2. Where are Clerk components used?

In this project, important Clerk places were:

- `app/layout.tsx`
- `app/components/top-nav.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/sign-up/[[...sign-up]]/page.tsx`

---

## 3. Understand the Provider Pattern

Many React libraries use a **provider**.

A provider gives data or configuration to everything inside it.

Example idea:

```tsx
<ClerkProvider>
  <YourApp />
</ClerkProvider>
```

If a child component uses Clerk, it must be inside `<ClerkProvider>`.

This is valid:

```tsx
<ClerkProvider>
  <SignIn />
</ClerkProvider>
```

This is not valid:

```tsx
<SignIn />
```

Because `<SignIn />` expects Clerk context, but no provider exists above it.

---

## 4. What Was Wrong in Our Code

The app had conditional logic.

In simple words:

```txt
If Clerk is enabled, wrap the app in ClerkProvider.
If Clerk is disabled, render the app without ClerkProvider.
```

That is okay.

The problem was that the layout and the sign-in page did not use exactly the same condition.

So one part of the app could say:

```txt
Clerk is disabled, do not render ClerkProvider.
```

But another page could still say:

```txt
Render <SignIn />.
```

That creates this bad situation:

```tsx
// No ClerkProvider here
<SignIn />
```

That caused the original runtime error.

---

## 5. The First Fix: Make Conditions Match

The first fix was to make the sign-in page use the same logic as the layout.

The logic became:

```ts
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasPublishableKey = Boolean(publishableKey);
const enableDevClerk = process.env.ENABLE_DEV_CLERK === "1";
const shouldUseClerk =
  hasPublishableKey &&
  (process.env.NODE_ENV === "production" || enableDevClerk);
```

Meaning:

- In production, Clerk can run if the publishable key exists.
- In local development, Clerk only runs if `ENABLE_DEV_CLERK=1` is set.
- If Clerk is not enabled, the page shows a safe fallback message instead of rendering Clerk UI.

This is a good beginner lesson:

> If two files make the same decision, they should use the same condition.

---

## 6. Why We Added `force-dynamic`

We also used:

```ts
export const dynamic = "force-dynamic";
```

In Next.js App Router, pages can sometimes be statically optimized.

For authentication pages, that can be risky because auth depends on runtime environment, cookies, headers, and production variables.

So `force-dynamic` tells Next.js:

> Do not pre-render this page as a static page. Resolve it at request time.

This is useful for auth pages like:

- `/sign-in`
- `/sign-up`
- root layout using auth state

---

## 7. The Bug Changed: No Crash, But Blank Clerk UI

After fixing the provider mismatch, the app no longer crashed.

But the deployed sign-in page still did not show the full Clerk UI.

It only showed the legal text:

```txt
By continuing, you agree to our Terms and acknowledge our Privacy Policy.
```

This is an important debugging lesson:

> When the symptom changes, the bug probably changed too.

At first, the problem was a React provider error.

Later, the problem became a production Clerk loading/domain issue.

Do not keep debugging the old error if the symptom has changed.

---

## 8. Debugging With a Temporary Badge

A temporary debug badge is a small visual helper added to the page.

It can answer questions like:

- Is Clerk enabled?
- Did the app receive the publishable key?
- Which Clerk frontend host is being used?
- Is this production or local?

A badge is useful because you can see important state directly in the browser without opening many logs.

Example debug badge idea:

```tsx
"use client";

import { useEffect, useState } from "react";

export function DebugBadge() {
  const [message, setMessage] = useState("checking...");

  useEffect(() => {
    const clerkEnabled = document.body.dataset.clerkEnabled === "1";
    const frontendApi = document.body.dataset.clerkFrontendApi ?? "missing";

    setMessage(
      clerkEnabled ? `Clerk enabled: ${frontendApi}` : "Clerk disabled",
    );
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 9999,
        padding: "8px 10px",
        borderRadius: 8,
        background: "#111827",
        color: "white",
        fontSize: 12,
      }}
    >
      {message}
    </div>
  );
}
```

Then the layout can expose safe debug data:

```tsx
<body
  data-clerk-enabled={shouldUseClerk ? "1" : "0"}
  data-clerk-frontend-api={clerkFrontendApi}
>
  <DebugBadge />
  {children}
</body>
```

Important security rule:

> Never show secret keys in the browser.

Safe to show temporarily:

- boolean values like `Clerk enabled: true`
- key prefix like `pk_live_`
- key length
- decoded public frontend host

Not safe to show:

- `CLERK_SECRET_KEY`
- full private tokens
- database passwords
- API secrets

---

## 9. Why a Badge Helped This Bug

The badge told us Clerk was enabled.

That was useful because it proved:

- the app had a publishable key
- the layout was choosing the Clerk branch
- the issue was not simply "Clerk disabled"

So we moved to the next question:

> If Clerk is enabled, why does the UI still not appear?

That led us to inspect browser network requests.

---

## 10. Debugging With Browser Network Tab

When a third-party UI does not load, check the browser network tab.

For Clerk, important requests include:

```txt
/__clerk/npm/@clerk/clerk-js@6/...
/__clerk/npm/@clerk/ui@1/...
/__clerk/v1/client
/__clerk/v1/environment
```

The first group is asset loading:

```txt
Clerk JavaScript and UI files
```

The second group is API loading:

```txt
Clerk environment and client data
```

Both must work.

A beginner might think:

> The big Clerk JavaScript file loaded, so Clerk must be fixed.

But that is not always true.

A JavaScript asset can load while the API still fails.

---

## 11. The Key Discovery: `host_invalid`

The final important error was:

```txt
400 host_invalid
```

With a message similar to:

```txt
We were unable to attribute this request to an instance running on Clerk.
Make sure that your Clerk Publishable Key is correct.
```

In beginner language, Clerk was saying:

> This website host is not properly connected to this Clerk production instance.

This was not a normal React bug anymore.

It was a production domain / Clerk configuration problem.

---

## 12. Why This Happened

The app was deployed on a Vercel domain like:

```txt
quantum-pulse-tau.vercel.app
```

But the Clerk production frontend API was connected to something like:

```txt
clerk.quantum-pulse-tau-vercel.app
```

Clerk expects the production app domain and Clerk frontend API domain/proxy to be correctly verified.

If the domain is not verified or the proxy is not configured, Clerk may reject API requests with:

```txt
host_invalid
```

That is why buying/configuring a real custom domain became the clean solution.

---

## 13. Why We Removed the Temporary Debug Code

Debug code is useful during investigation.

But after the investigation is done, it should usually be removed.

Why?

1. It can confuse users.
2. It can expose implementation details.
3. It adds noise to the codebase.
4. It can make future debugging harder.

So after finding the real cause, we removed:

- the temporary Clerk status badge
- temporary body diagnostic attributes
- custom proxy route experiments
- custom rewrite experiments

This is another important habit:

> Add temporary debug tools when needed, then clean them up when the root cause is known.

---

## 14. The Final Code Direction

The final direction was:

1. Keep Clerk.
2. Prepare the app for a proper custom domain.
3. Do not rely on fragile temporary proxy rewrites.
4. Keep Clerk's official proxy available only as an optional fallback.

The current clean setup is:

```ts
import { clerkMiddleware } from "@clerk/nextjs/server";

const enableClerkProxy = process.env.ENABLE_CLERK_PROXY === "1";

export default clerkMiddleware({
  frontendApiProxy: {
    enabled: enableClerkProxy,
  },
});
```

Meaning:

- Normal custom-domain setup: proxy disabled.
- Optional proxy setup: enable with `ENABLE_CLERK_PROXY=1` only if Clerk Dashboard is configured for it.

---

## 15. A Beginner-Friendly Debugging Process

Use this process for future bugs.

### Step 1: Write the exact symptom

Bad:

```txt
It does not work.
```

Better:

```txt
When I click Sign in on production, the page loads but the Clerk form is blank. I only see the legal text.
```

The more exact the symptom, the faster the fix.

---

### Step 2: Identify where the bug appears

Ask:

- Does it happen locally?
- Does it happen only on Vercel?
- Does it happen on every page?
- Does it happen only after clicking a button?
- Does it happen only when logged out?

For this bug:

```txt
Local and production behaved differently.
The serious remaining issue was on deployed Vercel production.
```

That pointed us toward environment variables, domains, and production configuration.

---

### Step 3: Read the browser console

The browser console shows JavaScript/runtime errors.

Useful signs:

- React errors
- hydration errors
- missing provider errors
- failed script loading
- Clerk runtime errors

For this bug, the first useful console clue was:

```txt
useSession can only be used within the <ClerkProvider /> component
```

---

### Step 4: Read the network tab

The network tab shows requests.

Look for:

- red failed requests
- `400`, `401`, `403`, `404`, `500` statuses
- requests that are blocked
- wrong domains
- unexpected redirects

For this bug, the important failed requests were:

```txt
/__clerk/v1/client
/__clerk/v1/environment
```

And the important status was:

```txt
400 host_invalid
```

---

### Step 5: Add a small temporary debug signal

This can be:

- a badge
- a console log
- a temporary text line
- a temporary API response field
- a debug query parameter

Good debug signals answer one clear question.

Examples:

```txt
Is Clerk enabled?
Which data source was used?
Did the env var exist?
Did this component render?
Which branch of code executed?
```

Bad debug signals dump too much information.

Do not log secrets.

---

### Step 6: Make one change at a time

Avoid changing five things at once.

If you change five things and the bug disappears, you may not know which change fixed it.

Better:

1. Change one thing.
2. Test.
3. Observe.
4. Continue.

For this bug, the phases were:

1. Fix provider mismatch.
2. Confirm Clerk enabled.
3. Check asset loading.
4. Check Clerk API calls.
5. Identify domain/proxy error.
6. Clean debug code.

---

### Step 7: Separate code bugs from configuration bugs

A code bug means the source code is wrong.

Examples:

- wrong condition
- missing provider
- bad import
- wrong route
- invalid component usage

A configuration bug means the code may be okay, but the environment is wrong.

Examples:

- missing Vercel env var
- wrong Clerk key
- unverified domain
- wrong DNS record
- production setting not enabled

This Clerk bug had both:

1. Code issue: sign-in could render without matching provider logic.
2. Configuration/domain issue: Clerk production rejected the host with `host_invalid`.

---

## 16. How to Design a Debug Badge

A good debug badge should be:

- small
- temporary
- visible only to you, if possible
- safe
- focused on one problem

### Example: Environment Badge

```tsx
export function EnvDebugBadge() {
  const isProd = process.env.NODE_ENV === "production";

  return (
    <div style={{ position: "fixed", right: 12, bottom: 12 }}>
      {isProd ? "Production" : "Development"}
    </div>
  );
}
```

### Example: Data Source Badge

This is useful when one value can come from multiple APIs.

```tsx
export function SourceBadge({ source }: { source: string }) {
  return (
    <span style={{ border: "1px solid currentColor", padding: "2px 6px" }}>
      {source}
    </span>
  );
}
```

Example output:

```txt
Source: yahoo-v7
Source: yahoo-chart
Source: nasdaq-history
```

### Example: Auth Status Badge

```tsx
export function AuthDebugBadge({ enabled }: { enabled: boolean }) {
  return (
    <div style={{ position: "fixed", right: 12, bottom: 12 }}>
      Auth: {enabled ? "enabled" : "disabled"}
    </div>
  );
}
```

---

## 17. When to Use a Badge vs Console Log

Use a badge when:

- you need to see the state directly on the page
- you are comparing local vs production visually
- the value affects rendering
- the user can easily send you a screenshot

Use `console.log` when:

- the information is only useful to developers
- it changes many times
- it is too detailed for the UI

Use server logs when:

- the code runs on the server
- the problem happens during fetch/build/render
- you need Vercel runtime logs

---

## 18. What Not to Do While Debugging

Avoid these habits:

1. Do not randomly change many files.
2. Do not ignore the exact error message.
3. Do not assume local and production behave the same.
4. Do not expose secrets in the browser.
5. Do not leave temporary debug UI forever.
6. Do not keep debugging the old symptom after the symptom changes.
7. Do not assume a loaded JavaScript file means the full service is working.

---

## 19. Debugging Checklist for Future Auth Bugs

Use this checklist for Clerk or other auth providers.

### Provider Check

- Is the app wrapped in the required provider?
- Are auth components rendered only inside that provider?
- Do layout and pages use the same enable/disable condition?

### Environment Check

- Is the public key set?
- Is the secret key set where needed?
- Are local and production env vars different?
- Did you redeploy after changing env vars?

### Runtime Check

- Does the page need `force-dynamic`?
- Is the auth page being statically generated by mistake?
- Is middleware/proxy running?

### Browser Check

- Any console errors?
- Any failed network requests?
- Are failed requests assets or API calls?
- What HTTP status appears?

### Domain Check

- Is the production domain verified?
- Is the Clerk frontend API domain verified?
- Are DNS records correct?
- Is the current app domain allowed by Clerk?

---

## 20. Debugging Vocabulary

### Symptom

What you see.

Example:

```txt
The sign-in form is blank.
```

### Root Cause

The real reason the bug happens.

Example:

```txt
Clerk rejects the production host with host_invalid.
```

### Reproduction

The steps to make the bug happen again.

Example:

```txt
Open production site, click Sign in, inspect network requests.
```

### Signal

Information that helps you understand the bug.

Example:

```txt
The debug badge says Clerk is enabled.
```

### Noise

Information that distracts but does not help.

Example:

```txt
Changing unrelated CSS while debugging auth.
```

---

## 21. The Most Important Lesson From Today's Bug

Today's bug was not solved by one magic change.

It was solved by narrowing the problem step by step:

1. The original error pointed to a missing provider.
2. Matching the Clerk conditions fixed that class of error.
3. The symptom changed to a blank Clerk UI.
4. A debug badge confirmed Clerk was enabled.
5. Direct asset checks confirmed Clerk JavaScript could load.
6. Network requests showed Clerk API returned `host_invalid`.
7. That proved the remaining blocker was domain/proxy configuration.
8. The temporary debug code was removed.
9. The app was prepared for a clean custom-domain setup.

This is real debugging:

> Observe, form a hypothesis, test it, learn from the result, then make the next smallest useful move.

---

## 22. A Simple Template You Can Use Next Time

When you ask for debugging help, use this format:

```txt
Symptom:
What exactly do I see?

Where:
Local, Vercel, or both?

Steps:
1. I open ...
2. I click ...
3. I see ...

Console:
Any browser console error?

Network:
Any failed request and status code?

Recent changes:
What did I change before the bug appeared?
```

Example for this bug:

```txt
Symptom:
The Clerk sign-in page is blank and only legal text appears.

Where:
Vercel production.

Steps:
1. Open production site.
2. Click Sign in.
3. Sign-in page opens but Clerk form does not render.

Console:
No provider error anymore.

Network:
/__clerk/v1/client returns 400 host_invalid.

Recent changes:
Added Clerk production keys and tried proxy setup.
```

This format makes debugging much faster.

---

## 23. Final Beginner Rule

Do not try to memorize every possible bug.

Instead, learn the process:

```txt
Exact symptom → relevant files → small test → observe result → next small fix
```

That process works for:

- Clerk bugs
- API fetch bugs
- Vercel bugs
- database bugs
- UI bugs
- deployment bugs

The best developers are not people who never get bugs.

The best developers are people who know how to investigate bugs calmly and step by step.
