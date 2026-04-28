# ScholChat - Robot Framework Tests

## Structure

```
tests/robot/
├── resources/
│   ├── common.resource       # Shared keywords (login, sidebar nav, modal helpers)
│   └── professor.resource    # Professor-specific keywords
├── professor/
│   └── professor_tests.robot # Sequential professor test scenarios
├── admin/
│   └── admin_tests.robot     # Admin test scenarios (to be implemented)
├── student/
│   └── student_tests.robot   # Student test scenarios (to be implemented)
├── parent/
│   └── parent_tests.robot    # Parent test scenarios (to be implemented)
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
# All professor tests (sequential)
robot --outputdir tests/robot/results tests/robot/professor/professor_tests.robot

# A single test by number
robot --test "02 - Professor Creates A Matiere" tests/robot/professor/professor_tests.robot

# All roles (when implemented)
robot --outputdir tests/robot/results tests/robot/
```

## Prerequisites
- `npm run dev` running on http://localhost:3000
- Backend running on http://localhost:8486
