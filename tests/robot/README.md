# ScholChat - Robot Framework Tests

## Structure

```
tests/robot/
├── resources/
│   ├── common.resource       # Shared keywords (login, sidebar nav, modal helpers)
│   ├── professor.resource    # Professor-specific keywords
│   ├── admin.resource        # Admin-specific keywords (incl. professor validation)
│   ├── signup.resource       # Self-registration keywords (identity/type/document steps)
│   └── activation.resource   # Reads the activation token from the local DB and activates
├── professor/
│   ├── professor_tests.robot           # Sequential scenarios for an already-active professor
│   └── professor_onboarding_tests.robot # Full lifecycle: signup → admin validation →
│                                         # activation → password → the same sidebar flow
├── admin/
│   └── admin_tests.robot     # Admin test scenarios (to be implemented)
├── student/
│   └── student_tests.robot   # Student test scenarios (to be implemented)
├── parent/
│   └── parent_tests.robot    # Parent test scenarios (to be implemented)
├── fixtures/                 # Placeholder CNI/selfie images used by signup.resource
└── requirements.txt
```

## Setup

```bash
python3 -m venv tests/robot/venv
source tests/robot/venv/bin/activate
pip install -r tests/robot/requirements.txt
```

## Run

```bash
# All professor tests (sequential) — against the deployed site (default BASE_URL)
robot --outputdir tests/robot/results tests/robot/professor/professor_tests.robot

# A single test by number
robot --test "02 - Professor Creates A Matiere" tests/robot/professor/professor_tests.robot

# All roles (when implemented)
robot --outputdir tests/robot/results tests/robot/

# Full professor onboarding (signup → admin validation → activation → sidebar flow),
# against a LOCAL stack — see "Onboarding suite" below for the one-time local setup.
robot --outputdir tests/robot/results \
  --variable BASE_URL:http://localhost:3000 \
  --variable LOGIN_URL:http://localhost:3000/schoolchat/login \
  --variable BROWSER:headlesschrome \
  tests/robot/professor/professor_onboarding_tests.robot
```

`BROWSER:headlesschrome` is only needed in a sandbox/CI without a display; drop it to watch
the run in a real Chrome window.

## Prerequisites
- `npm run dev` running on http://localhost:3000
- Backend running on http://localhost:8486

## Onboarding suite (`professor_onboarding_tests.robot`)

This suite registers a brand-new professor account through the real signup form, so it needs
a full local stack (it will create real rows in your local DB — don't point it at prod):

1. **Postgres + MinIO** — `docker run` (or reuse existing) containers matching
   `business/src/main/resources/application-h2.properties` (despite the profile name, it's a
   real Postgres, not H2): `scholchat` DB, user `scholchat_user` / `StrongPassword123`,
   MinIO on `:9000`.
2. **Backend**: `cd business && mvn spring-boot:run -Dspring-boot.run.profiles=h2`
   (port 8486).
3. **Frontend**: `npm run dev` (port 3000).
4. **Admin account**: the suite logs in as `admin@example.com` / `password123`
   (`resources/admin.resource`) to validate the new professor — seed one if your DB doesn't
   have it.
5. **`psql` on PATH** — `activation.resource` reads the activation token directly from
   `ressources.utilisateurs.activation_token` (same token a real email would carry) instead
   of needing inbox/IMAP access, since this is a local dev DB you already have access to.

Each run generates a unique professor (timestamp-suffixed name/email/phone), so it's safe to
re-run repeatedly without cleanup.
