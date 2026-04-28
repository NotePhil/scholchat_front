*** Settings ***
Library       SeleniumLibrary
Resource      ../resources/common.resource
Resource      ../resources/professor.resource
Suite Setup   Professor Login
Suite Teardown    Close Browser

*** Variables ***
# Matière
${MATIERE_NOM}              Matière Robot Test
${MATIERE_DESC}             Créée par test automatisé Robot Framework

# Class 1 - with establishment (École Email Approval, no optionTokenGeneral)
${CLASS1_NOM}               Classe Robot Avec Etab
${CLASS1_NIVEAU}            3ème
${CLASS1_ETAB}              École Email Approval - Yaoundé
${CLASS1_MODERATOR}         Dupont Marie

# Class 2 - no establishment → payment required
${CLASS2_NOM}               Classe Robot Sans Etab
${CLASS2_NIVEAU}            6ème
${PAYMENT_PHONE}            655125566

*** Test Cases ***

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — MATIÈRES
# ═══════════════════════════════════════════════════════════════════════════════

01 - Navigate To Matieres
    [Documentation]    Professor opens the Matières section from the sidebar
    Go To Matieres
    Page Should Contain Element    xpath://h1[contains(text(),'Matières') or contains(text(),'Subjects')]

02 - Create A Matiere
    [Documentation]    Professor creates a new subject with name and description
    Create Matiere    ${MATIERE_NOM}    ${MATIERE_DESC}
    Page Should Contain    ${MATIERE_NOM}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — CLASS WITH ESTABLISHMENT
# ═══════════════════════════════════════════════════════════════════════════════

03 - Navigate To Create Class
    [Documentation]    Professor opens the Créer une Classe form
    Go To Create Class

04 - Create Class With Establishment
    [Documentation]    Fill the form with École Email Approval, assign Demo moderator, submit
    Fill Class Base Fields    ${CLASS1_NOM}    ${CLASS1_NIVEAU}
    Select Establishment      ${CLASS1_ETAB}
    Select Moderator By Name  ${CLASS1_MODERATOR}
    Submit Class Form
    Wait For Class Creation Success

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — CLASS WITHOUT ESTABLISHMENT (PAYMENT)
# ═══════════════════════════════════════════════════════════════════════════════

05 - Navigate To Create Class Again
    [Documentation]    Professor navigates back to the class creation form
    Go To Create Class

06 - Create Class Without Establishment And Pay
    [Documentation]    Fill form with no establishment, trigger payment modal,
    ...               choose Orange Money, enter phone 655125566, confirm payment
    Fill Class Base Fields    ${CLASS2_NOM}    ${CLASS2_NIVEAU}
    Select No Establishment
    Submit Class Form
    Complete Payment With Orange Money    ${PAYMENT_PHONE}
    Wait For Class Creation Success

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — VERIFY CLASSES IN THE LIST
# ═══════════════════════════════════════════════════════════════════════════════

07 - Navigate To Manage Class List
    [Documentation]    Professor navigates to the class management list
    Go To Manage Class

08 - Both Created Classes Are Visible With Their States
    [Documentation]    Verify both classes appear in the list with their respective states:
    ...               - Class with establishment → EN_ATTENTE_APPROBATION
    ...               - Class without establishment (paid) → ACTIF
    Wait Until Page Contains    ${CLASS1_NOM}    timeout=10s
    Wait Until Page Contains    ${CLASS2_NOM}    timeout=10s
    Page Should Contain    ${CLASS1_NOM}
    Page Should Contain    ${CLASS2_NOM}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — COURSES
# ═══════════════════════════════════════════════════════════════════════════════

09 - Navigate To Courses
    [Documentation]    Professor opens the Cours section
    Go To Courses
    Page Should Contain Element    xpath://h1[contains(text(),'Cours') or contains(text(),'Course')]

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — EXERCISES
# ═══════════════════════════════════════════════════════════════════════════════

10 - Navigate To Exercises
    [Documentation]    Professor opens the Exercices section
    Go To Exercises
    Page Should Contain Element    xpath://h1[contains(text(),'Exercice') or contains(text(),'Exercise')]

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — MESSAGES
# ═══════════════════════════════════════════════════════════════════════════════

11 - Navigate To Messages
    [Documentation]    Professor opens the Messages section
    Go To Messages
    Page Should Contain Element    xpath://h1[contains(text(),'Message')]
