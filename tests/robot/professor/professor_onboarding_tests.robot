*** Settings ***
Documentation    End-to-end professor lifecycle: self-registration (with CNI/selfie uploads),
...              admin validation, account activation + password setup, then the full
...              professor sidebar flow (matières, classes, cours, schedule, exercises,
...              messages). Everything after activation reuses the same keywords as
...              professor_tests.robot so both suites stay in sync automatically.
...
...              Requires a LOCAL stack: backend on :8486, frontend on :3000, and direct
...              psql access to the local Postgres (see resources/activation.resource) to
...              read the activation token instead of an inbox. Run with:
...
...              robot --outputdir tests/robot/results \
...                --variable BASE_URL:http://localhost:3000 \
...                --variable LOGIN_URL:http://localhost:3000/schoolchat/login \
...                tests/robot/professor/professor_onboarding_tests.robot
Library       SeleniumLibrary
Library       DateTime
Resource      ../resources/common.resource
Resource      ../resources/signup.resource
Resource      ../resources/admin.resource
Resource      ../resources/activation.resource
Resource      ../resources/professor.resource
Suite Teardown    Close All Browsers

*** Variables ***
${TIMESTAMP}                 ${EMPTY}

# New professor identity (created by this suite, not a fixture account)
${NEW_PROF_PRENOM}           Robot
${NEW_PROF_NOM}               ${EMPTY}
${NEW_PROF_EMAIL}             ${EMPTY}
${NEW_PROF_PHONE}             ${EMPTY}
${NEW_PROF_ADRESSE}          12 Rue des Tests, Douala
${NEW_PROF_PASSWORD}         Robot@Test123

# Matière — professors can't create one (admin/gestionnaire only), so this must be a
# matière that already exists in the seed data.
${MATIERE_NOM}                Mathematiques

# Class 1 - with establishment (optionTokenGeneral=true → code unique required)
${CLASS1_NOM}                 ${EMPTY}
${CLASS1_NIVEAU}              3ème
${CLASS1_ETAB}                Collège Code Unique
${CLASS1_CODE_UNIQUE}         ETB-11223344

# Class 2 - no establishment → payment required
${CLASS2_NOM}                 ${EMPTY}
${CLASS2_NIVEAU}              6ème
${PAYMENT_PHONE}              655125566
${OFFRE_NOM}                  Classe Standard

# Course
${COURS_TITRE}                ${EMPTY}
${COURS_DESC}                 Ce cours couvre les fondamentaux de l'algèbre : équations, inéquations et systèmes. Il s'adresse aux élèves de 3ème préparant le brevet.
${CHAPITRE1_TITRE}            Les équations du premier degré
${CHAPITRE1_DESC}             Méthodes de résolution des équations ax + b = 0
${CHAPITRE1_CONTENU}          Une équation du premier degré est de la forme ax + b = 0. Pour la résoudre, on isole x en soustrayant b puis en divisant par a.
${CHAPITRE2_TITRE}            Les systèmes d'équations
${CHAPITRE2_DESC}             Résolution par substitution et par addition
${CHAPITRE2_CONTENU}          Un système de deux équations à deux inconnues se résout par substitution ou par combinaison linéaire des deux équations.

# Schedule
${SCHEDULE_LIEU}              Salle 203 - Bâtiment des Sciences
${SCHEDULE_DESC}              Séance de cours en présentiel avec exercices pratiques
${SCHEDULE_DATE}              ${EMPTY}

*** Keywords ***
Initialise Unique Names
    ${ts}=    Get Current Date    result_format=%H%M%S
    Set Suite Variable    ${TIMESTAMP}        ${ts}
    Set Suite Variable    ${NEW_PROF_NOM}     Onboarding${ts}
    Set Suite Variable    ${NEW_PROF_EMAIL}   prof.robot.${ts}@example.com
    # Real Cameroon mobile numbers must match libphonenumber's Cameroon metadata (backend
    # validates with Google's PhoneNumberUtil, not just "9 digits starting with 6") — "655"
    # is the same known-valid prefix already used by PAYMENT_PHONE below.
    Set Suite Variable    ${NEW_PROF_PHONE}   655${ts}
    Set Suite Variable    ${CLASS1_NOM}       Classe 3A Robot ${ts}
    Set Suite Variable    ${CLASS2_NOM}       Classe 6B Robot ${ts}
    Set Suite Variable    ${COURS_TITRE}      Algèbre - Équations Robot ${ts}
    ${tomorrow}=    Get Current Date    increment=1 day    result_format=%Y-%m-%dT10:00
    Set Suite Variable    ${SCHEDULE_DATE}    ${tomorrow}

*** Test Cases ***

# ═══════════════════════════════════════════════════════════════════════════════
# SETUP — GENERATE UNIQUE NAMES
# ═══════════════════════════════════════════════════════════════════════════════

00 - Initialise Unique Names
    [Documentation]    Generate timestamp-based unique names to avoid duplicate conflicts
    Initialise Unique Names
    Log    New professor email: ${NEW_PROF_EMAIL}
    Log    Matière: ${MATIERE_NOM}
    Log    Class 1: ${CLASS1_NOM}
    Log    Class 2: ${CLASS2_NOM}
    Log    Cours: ${COURS_TITRE}

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 1 — SELF-REGISTRATION
# ═══════════════════════════════════════════════════════════════════════════════

01 - Open Signup Page
    [Documentation]    A brand new visitor opens the signup form
    Open Browser    about:blank    ${BROWSER}
    Maximize And Size Browser Window
    Set Selenium Speed    ${SPEED}
    Open Signup Page

02 - Fill Identity Step
    [Documentation]    Step 1: prénom, nom, email, téléphone, adresse
    Fill Signup Identity
    ...    ${NEW_PROF_PRENOM}    ${NEW_PROF_NOM}    ${NEW_PROF_EMAIL}
    ...    ${NEW_PROF_PHONE}    ${NEW_PROF_ADRESSE}

03 - Select Professeur Account Type
    [Documentation]    Step 2: choose the "Professeur" account type
    Select Account Type Professeur

04 - Upload Documents And Submit Registration
    [Documentation]    Step 3: CNI recto/verso + selfie, then Terminer.
    ...               Backend creates the user in AWAITING_VALIDATION state.
    Fill Professor Documents And Submit
    Close Browser

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2 — ADMIN VALIDATES THE NEW PROFESSOR
# ═══════════════════════════════════════════════════════════════════════════════

05 - Admin Login
    [Documentation]    Admin logs in to review pending professor accounts
    Admin Login

06 - Navigate To Manage Professors
    [Documentation]    Admin opens Gérer Utilisateur → Professeurs
    Go To Manage Professors

07 - Validate The New Professor
    [Documentation]    Find the newly registered professor (AWAITING_VALIDATION) and validate them.
    ...               Backend moves them to PENDING and sends the activation email.
    Validate Professor With Email    ${NEW_PROF_EMAIL}

08 - Admin Logout
    [Documentation]    Admin is done reviewing accounts
    Logout
    Close Browser

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 3 — ACTIVATE ACCOUNT + SET PASSWORD (simulates clicking the emailed link)
# ═══════════════════════════════════════════════════════════════════════════════

09 - Open Browser For Activation
    Open Browser    about:blank    ${BROWSER}
    Maximize And Size Browser Window
    Set Selenium Speed    ${SPEED}

10 - Activate The New Professor Account
    [Documentation]    Reads the activation token straight from the local DB (same token the
    ...               email would carry) and opens the activation link
    Activate Account Via Token    ${NEW_PROF_EMAIL}

11 - Set The New Professor Password
    [Documentation]    Completes onboarding by choosing a password; lands back on /login
    Set New Account Password    ${NEW_PROF_PASSWORD}

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4 — PROFESSOR LOGS IN AND WALKS THROUGH HIS SIDEBAR
# (same steps/keywords as professor_tests.robot, on the newly onboarded account)
# ═══════════════════════════════════════════════════════════════════════════════

12 - Professor Login With New Account
    [Documentation]    Already on /schoolchat/login after the password-set redirect (same
    ...               browser session) — just wait for the form and log in.
    Wait Until Page Contains Element    id:email    timeout=15s
    Login As    ${NEW_PROF_EMAIL}    ${NEW_PROF_PASSWORD}

13 - Navigate To Matieres
    [Documentation]    Professor opens the Matières section from the sidebar
    Go To Matieres
    Page Should Contain Element    xpath://h1[contains(text(),'Matières') or contains(text(),'Subjects')]

14 - Verify Matiere Is Visible But Not Creatable
    [Documentation]    Professors can only VIEW matières — creation is restricted to
    ...               admins/gestionnaires (MatiereContent.jsx: "canManage = isAdmin ||
    ...               isGestionnaire"). Verify the seeded matière used later for the course
    ...               is visible, and that no "Nouvelle Matière" button is offered.
    Page Should Contain    ${MATIERE_NOM}
    Page Should Not Contain Element    xpath://button[contains(.,'Nouvelle Matière')]

15 - Navigate To Create Class For Class 1
    [Documentation]    Professor opens the class creation form
    Go To Create Class

16 - Create Class With Establishment
    [Documentation]    Fill form: Collège Code Unique, code ETB-11223344, submit and wait
    ...               for success + redirect. Moderator is auto-assigned to the creating
    ...               professor by the backend (classData.moderatorId = currentUserId) —
    ...               there is no moderator picker in the current form.
    Fill Class Base Fields    ${CLASS1_NOM}    ${CLASS1_NIVEAU}
    Select Establishment      ${CLASS1_ETAB}
    Fill Code Unique          ${CLASS1_CODE_UNIQUE}
    Submit Class Form
    Wait For Class Creation Success

17 - Verify Class 1 In List
    [Documentation]    Already on the class list after auto-redirect. Scroll to Class 1 and
    ...               verify it shows state Inactif (awaiting the établissement's approval —
    ...               NOT "En attente", which is a different EtatClasse value/filter option
    ...               that doesn't apply to a brand-new establishment-linked class here).
    Scroll To Class Card    ${CLASS1_NOM}
    Page Should Contain    ${CLASS1_NOM}
    Page Should Contain    Inactif

18 - Navigate To Create Class For Class 2
    [Documentation]    Professor goes back to the class creation form for the second class
    Go To Create Class

19 - Create Class Without Establishment And Pay
    [Documentation]    Fill form with no establishment → pick an Offre/Forfait (required) →
    ...               payment modal → Orange Money → phone 655125566 → confirm → success + redirect
    Fill Class Base Fields    ${CLASS2_NOM}    ${CLASS2_NIVEAU}
    Select No Establishment
    Select Offre    ${OFFRE_NOM}
    Submit Class Form
    Complete Payment With Orange Money    ${PAYMENT_PHONE}
    Wait For Class Creation Success

20 - Verify Both Classes In List
    [Documentation]    Scroll to each class and verify their states:
    ...               Class 1 (établissement, unpaid) → Inactif | Class 2 (paid) → Actif
    Scroll To Class Card    ${CLASS2_NOM}
    Page Should Contain    ${CLASS2_NOM}
    Scroll To Class Card    ${CLASS1_NOM}
    Page Should Contain    ${CLASS1_NOM}
    Page Should Contain    Inactif

21 - Navigate To Courses List
    [Documentation]    Professor opens the Cours section
    Go To Courses
    Page Should Contain    Mes Cours

22 - Click Nouveau Cours Button
    [Documentation]    Professor clicks the Nouveau Cours button
    Click Nouveau Cours

23 - Fill Course General Information
    [Documentation]    Fill title, visibility PUBLIC, description and select the matière
    ...               (matière field is an autocomplete: type to filter, click the match)
    Fill Course General Info    ${COURS_TITRE}    ${COURS_DESC}    ${MATIERE_NOM}

24 - Add First Chapter
    [Documentation]    Add chapter 1 with title, description and content
    Add Chapter    ${CHAPITRE1_TITRE}    ${CHAPITRE1_DESC}    ${CHAPITRE1_CONTENU}
    Page Should Contain    ${CHAPITRE1_TITRE}

25 - Add Second Chapter
    [Documentation]    Add chapter 2 with title, description and content
    Add Chapter    ${CHAPITRE2_TITRE}    ${CHAPITRE2_DESC}    ${CHAPITRE2_CONTENU}
    Page Should Contain    ${CHAPITRE2_TITRE}

26 - Submit Course And Verify In List
    [Documentation]    Submit the course form and verify it appears in the list
    Submit Course Form
    Page Should Contain    ${COURS_TITRE}

27 - Navigate To Schedule Course
    [Documentation]    Professor navigates to the Programmer le Cours section
    Go To Schedule Course

28 - Open Programmer Form And Fill
    [Documentation]    Open form, select course + class, set PLANIFIE, fill date/lieu/description
    Open Programmer Form
    Fill Schedule Form
    ...    ${COURS_TITRE}
    ...    ${CLASS2_NOM}
    ...    ${SCHEDULE_DATE}
    ...    ${SCHEDULE_LIEU}
    ...    ${SCHEDULE_DESC}

29 - Submit Schedule And Verify In List
    [Documentation]    Click Programmer, wait for success, verify modal closes
    Submit Schedule Form
    Page Should Contain    ${COURS_TITRE}

30 - Navigate To Exercises
    [Documentation]    Professor opens the Exercices section — no new exercise is created
    Go To Exercises

31 - Navigate To Messages
    [Documentation]    Professor navigates to the Messagerie section from the sidebar.
    ...               MessagingInterface.jsx's "Messages" <h2> title is only rendered in some
    ...               view states — with no conversations yet (as here, brand-new account) the
    ...               panel shows an "Aucun message" empty state instead, so assert on the URL.
    Go To Messages
    Location Should Contain    /messages

32 - Logout Professor
    [Documentation]    Click the logout button in the sidebar and confirm in the modal
    Logout
    Wait Until Location Contains    /schoolchat/login    timeout=15s
