# Session Lifecycle Model (Sprint 1 – King Hei Law)

This document defines the session lifecycle model for the NutriHelp backend.  
It establishes the official session table, lifecycle states, and state transition logic used by the authentication and security components.

---

## 1. Official Session Table

The system currently contains multiple tables related to sessions:

- `auth_sessions`
- `user_session`
- **`user_sessions` (selected)**

After reviewing the schema, `public.user_sessions` is selected as the **official and primary session table** because:

- It supports device linkage (`device_id`)
- It stores session tokens and refresh tokens
- It already includes key lifecycle fields (`is_active`, `expires_at`, `ended_at`, `end_reason`)
- It uses a UUID PK and integrates with `user_devices` and security tables

**All session lifecycle logic in Sprint 1 and future sprints will use `public.user_sessions` exclusively.**

---

## 2. Lifecycle States

The session lifecycle is implemented using **existing columns only**.  
No database schema changes are required.

### ### 2.1 Active Session
A session is considered **active** when:

- `is_active = true`
- `ended_at IS NULL`
- `expires_at > now()`

Active sessions are allowed to make authenticated API calls.

---

### 2.2 Expired Session
A session becomes **expired** when its `expires_at` timestamp passes.

When the cleanup job processes an expired session, it sets:

- `is_active = false`
- `ended_at = now()`
- `end_reason = 'expired'`

This marks the session as no longer valid.

---

### 2.3 Revoked Session (Handled by Token Revocation Logic)
When the token revocation component explicitly revokes a token, the associated session must be marked as:

- `is_active = false`
- `ended_at = now()`
- `end_reason = 'revoked'`

This state is used for:
- “Logout from all devices”
- “Logout from this device”
- Refresh-token rotation failures

---

### 2.4 Compromised Session (Security Detection – Owned by King)
A session is marked **compromised** when suspicious activity is detected  
(e.g., low-trust device, anomaly rule trigger, suspicious login pattern).

The session is updated to:

- `is_active = false`
- `ended_at = now()`
- `end_reason = 'compromised'`

A `security_alerts` entry will also be created to notify the user.

---

## 3. State Transition Diagram

         expires_at passed
 active ───────────────▶ expired
    │
    │ manual logout or token revocation
    ├──────────────────────────────────▶ revoked
    │
    │ security/anomaly rule triggered
    └──────────────────────────────────▶ compromised


This unified model ensures that all parts of the system—token revocation, session cleanup, compromised-session detection—share the same definitions and update the same fields consistently.

---

## 4. Purpose of This Lifecycle Definition

This lifecycle model is required to support:

- Smart expiry logic (Step 2)
- Session cleanup and pruning (Step 4)
- Compromised-session detection logic (Step 5)
- Consistent coordination with teammate’s token revocation implementation
- Standardised session state auditing and reporting

With the lifecycle definition established here, all subsequent Sprint 1 features will build cleanly and consistently on top of `public.user_sessions`.

---

## 5. Next Steps (Sprint 1 Implementation Roadmap)

After completing this lifecycle definition:

1. **Step 2:** Implement smart expiry when creating sessions  
2. **Step 3:** Update activity timestamps on each authenticated request  
3. **Step 4:** Implement scheduled cleanup for expired sessions  
4. **Step 5:** Implement compromised-session helper  
5. **Step 6:** Add initial detection rule (e.g., low-trust device)

These will be documented and implemented in subsequent tasks under the same feature branch.

---

*Prepared by: King Hei Law*  

