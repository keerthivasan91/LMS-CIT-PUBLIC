# LMS-CIT Backend Testing Guide

This document explains the **complete testing strategy** used in the LMS-CIT backend. The project follows a **production-grade, CI/CD-ready testing pyramid** covering unit, integration, security, performance, and end‑to‑end (E2E) tests.

---

## 📁 Test Folder Structure

```
tests/
├── unit/           # Pure logic tests (no DB, no server)
├── integration/    # API + DB integration tests
├── security/       # RBAC, IDOR, authorization tests
├── performance/    # CI-safe load & stress tests
├── e2e/            # End-to-End system tests
│   └── postman/    # Postman collections + environments
└── README.md       # This file
```

---

## 🧪 1. Unit Tests

**Purpose**

* Validate pure business logic
* No Express app
* No database

**Examples**

* Password hashing
* Leave balance calculation
* Leave validation rules
* Escalation logic

**Command**

```bash
npx jest tests/unit
```

**Why important?**

* Fast feedback
* Catches logic bugs early
* Safe to run on every commit

---

## 🔗 2. Integration Tests

**Purpose**

* Test real API routes
* Use real MySQL test database
* Validate controllers, middleware, and DB interaction

**Covered flows**

* Auth login
* Leave apply
* Leave approval (HOD → Admin → Principal)
* User creation
* Password reset

**Command**

```bash
npx jest tests/integration --runInBand
```

**Key points**

* Uses `supertest`
* Uses session-based authentication
* Cleans DB state before/after tests

---

## 🔐 3. Security Tests

**Purpose**

* Enforce authorization rules
* Prevent privilege escalation
* Detect IDOR vulnerabilities

**Covered checks**

* Faculty cannot access admin routes
* Only correct roles can approve leave
* Users cannot access others’ resources

**Command**

```bash
npx jest tests/security --runInBand
```

**Why critical?**
Security tests prevent real‑world attacks caused by misconfigured access control.

---

## ⚡ 4. Performance Tests

**Purpose**

* Ensure APIs handle load
* CI‑safe (light, non‑flaky)

**Tools used**

* `autocannon`

**Covered endpoints**

* `/health`

**Command**

```bash
npx jest tests/performance --runInBand
```

**CI behavior**

* Automatically skips if server is not reachable
* Prevents CI failures due to environment limits

---

## 🌐 5. End‑to‑End (E2E) Tests

**Purpose**

* Validate complete user journeys
* Test the system exactly like a real user

**Tool used**

* Postman + Newman

**Covered flow**

1. Admin login
2. Admin adds user
3. User logs in
4. User applies leave
5. Substitute approves
6. HOD approves
7. Principal approves
8. Admin cleanup

**Command**

```bash
npx newman run tests/e2e/postman/LMS-CIT.e2e.collection.json \
  -e tests/e2e/postman/env.ci.json
```

**Why E2E tests?**
They validate that **all layers work together correctly**.

---

## 🚀 Recommended CI/CD Pipeline Order

```bash
# 1. Unit tests
npx jest tests/unit --runInBand

# 2. Integration tests
npx jest tests/integration --runInBand

# 3. Security tests
npx jest tests/security --runInBand

# 4. Performance tests
npx jest tests/performance --runInBand

# 5. Start server
npm start &

# 6. End‑to‑End tests
npx newman run tests/e2e/postman/LMS-CIT.e2e.collection.json \
  -e tests/e2e/postman/env.ci.json

or

bash tests/e2e/run-e2e.sh
```

---

## ✅ CI/CD Readiness Status

* ✔ Unit tests: Stable
* ✔ Integration tests: Stable
* ✔ Security tests: Enforced
* ✔ Performance tests: CI‑safe
* ✔ E2E tests: Full system verified

**This test suite is production‑ready and safe for continuous deployment.**

---

## 📝 Notes

* Always use a **dedicated test database**
* Never run integration/E2E tests on production DB
* Keep E2E data isolated and disposable

---

**Maintained by:** LMS‑CIT Backend Team
