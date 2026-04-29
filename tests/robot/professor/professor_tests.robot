*** Settings ***
Library       SeleniumLibrary
Library       DateTime
Resource      ../resources/common.resource
Resource      ../resources/professor.resource
Suite Setup   Professor Login
Suite Teardown    Close Browser

*** Variables ***
${TIMESTAMP}                ${EMPTY}

# Matière
${MATIERE_NOM}              ${EMPTY}
${MATIERE_DESC}             Créée par test automatisé Robot Framework

# Class 1 - with establishment (optionTokenGeneral=true → code unique required)
${CLASS1_NOM}               ${EMPTY}
${CLASS1_NIVEAU}            3ème
${CLASS1_ETAB}              Collège Code Unique - Bafoussam
${CLASS1_CODE_UNIQUE}       ETB-11223344
${CLASS1_MODERATOR}         Marie Dupont

# Class 2 - no establishment → payment required
${CLASS2_NOM}               ${EMPTY}
${CLASS2_NIVEAU}            6ème
${PAYMENT_PHONE}            655125566

# Schedule
${SCHEDULE_LIEU}            Salle 101 Robot
${SCHEDULE_DESC}            Session programmée par test automatisé
# Date 1 month from now in datetime-local format - set dynamically
${SCHEDULE_DATE}            ${EMPTY}
${COURS_DESC}               Cours créé par test automatisé Robot Framework
${CHAPITRE1_TITRE}          Chapitre 1 - Introduction
${CHAPITRE1_DESC}           Vue d’ensemble du premier chapitre
${CHAPITRE1_CONTENU}        Contenu détaillé du premier chapitre de test
${CHAPITRE2_TITRE}          Chapitre 2 - Développement
${CHAPITRE2_DESC}           Vue d’ensemble du deuxième chapitre
${CHAPITRE2_CONTENU}        Contenu détaillé du deuxième chapitre de test

*** Keywords ***
Initialise Unique Names
    ${ts}=    Get Current Date    result_format=%H%M%S
    Set Suite Variable    ${TIMESTAMP}       ${ts}
    Set Suite Variable    ${MATIERE_NOM}     Matière Robot ${ts}
    Set Suite Variable    ${CLASS1_NOM}      Classe Etab Robot ${ts}
    Set Suite Variable    ${CLASS2_NOM}      Classe Sans Etab Robot ${ts}
    Set Suite Variable    ${COURS_TITRE}     Cours Robot ${ts}
    # Date prevue: tomorrow at 10:00
    ${tomorrow}=    Get Current Date    increment=1 day    result_format=%Y-%m-%dT10:00
    Set Suite Variable    ${SCHEDULE_DATE}   ${tomorrow}

*** Test Cases ***

# ═══════════════════════════════════════════════════════════════════════════════
# SETUP — GENERATE UNIQUE NAMES
# ═══════════════════════════════════════════════════════════════════════════════

00 - Initialise Unique Names
    [Documentation]    Generate timestamp-based unique names to avoid duplicate conflicts
    Initialise Unique Names
    Log    Matière: ${MATIERE_NOM}
    Log    Class 1: ${CLASS1_NOM}
    Log    Class 2: ${CLASS2_NOM}
    Log    Cours: ${COURS_TITRE}

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
# STEP 2 — CLASS 1 : WITH ESTABLISHMENT
# ═══════════════════════════════════════════════════════════════════════════════

03 - Navigate To Create Class For Class 1
    [Documentation]    Professor opens the class creation form
    Go To Create Class

04 - Create Class With Establishment
    [Documentation]    Fill form: Collège Code Unique, code ETB-11223344,
    ...               moderator Marie Dupont, submit and wait for success + redirect
    Fill Class Base Fields    ${CLASS1_NOM}    ${CLASS1_NIVEAU}
    Select Establishment      ${CLASS1_ETAB}
    Fill Code Unique          ${CLASS1_CODE_UNIQUE}
    Select Moderator By Name  ${CLASS1_MODERATOR}
    Submit Class Form
    Wait For Class Creation Success

05 - Verify Class 1 In List
    [Documentation]    Already on the class list after auto-redirect.
    ...               Scroll to Class 1 and verify it shows state En attente
    Scroll To Class Card    ${CLASS1_NOM}
    Page Should Contain    ${CLASS1_NOM}
    Page Should Contain    En attente

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — CLASS 2 : WITHOUT ESTABLISHMENT (PAYMENT)
# ═══════════════════════════════════════════════════════════════════════════════

06 - Navigate To Create Class For Class 2
    [Documentation]    Professor goes back to the class creation form for the second class
    Go To Create Class

07 - Create Class Without Establishment And Pay
    [Documentation]    Fill form with no establishment → payment modal →
    ...               Orange Money → phone 655125566 → confirm → success + redirect
    Fill Class Base Fields    ${CLASS2_NOM}    ${CLASS2_NIVEAU}
    Select No Establishment
    Submit Class Form
    Complete Payment With Orange Money    ${PAYMENT_PHONE}
    Wait For Class Creation Success

08 - Verify Both Classes In List
    [Documentation]    Already on the class list after auto-redirect.
    ...               Scroll to each class and verify their states:
    ...               Class 1 → En attente | Class 2 → Actif
    Scroll To Class Card    ${CLASS2_NOM}
    Page Should Contain    ${CLASS2_NOM}
    Scroll To Class Card    ${CLASS1_NOM}
    Page Should Contain    ${CLASS1_NOM}
    Page Should Contain    En attente
    Page Should Contain    Actif

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — COURS
# ═══════════════════════════════════════════════════════════════════════════════

09 - Navigate To Courses List
    [Documentation]    Professor opens the Cours section and sees the course list
    Go To Courses
    Page Should Contain    Mes Cours

10 - Click Nouveau Cours Button
    [Documentation]    Professor clicks the Nouveau Cours button to open the creation form
    Click Nouveau Cours

11 - Fill Course General Information
    [Documentation]    Fill title, visibility PUBLIC, description and select the matière
    ...               General info must be filled BEFORE adding chapters
    Fill Course General Info    ${COURS_TITRE}    ${COURS_DESC}    ${MATIERE_NOM}

12 - Add First Chapter
    [Documentation]    Add chapter 1 with title, description and content
    Add Chapter    ${CHAPITRE1_TITRE}    ${CHAPITRE1_DESC}    ${CHAPITRE1_CONTENU}
    Page Should Contain    ${CHAPITRE1_TITRE}

13 - Add Second Chapter
    [Documentation]    Add chapter 2 with title, description and content
    Add Chapter    ${CHAPITRE2_TITRE}    ${CHAPITRE2_DESC}    ${CHAPITRE2_CONTENU}
    Page Should Contain    ${CHAPITRE2_TITRE}

14 - Submit Course And Verify In List
    [Documentation]    Submit the course form, wait for success toast,
    ...               then verify the course appears in the list
    Submit Course Form
    Page Should Contain    ${COURS_TITRE}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — PROGRAMMER LE COURS
# ═══════════════════════════════════════════════════════════════════════════════

15 - Navigate To Schedule Course
    [Documentation]    Professor navigates to the Programmer le Cours section
    Go To Schedule Course
    Page Should Contain    Programmer un Cours

16 - Open Programmer Form And Fill
    [Documentation]    Click Programmer un Cours, select the created course,
    ...               select CLASS2 (Actif, no etab), choose PLANIFIE,
    ...               fill date/lieu/description, leave participants on Tout
    Open Programmer Form
    Fill Schedule Form
    ...    ${COURS_TITRE}
    ...    ${CLASS2_NOM}
    ...    ${SCHEDULE_DATE}
    ...    ${SCHEDULE_LIEU}
    ...    ${SCHEDULE_DESC}

17 - Submit Schedule And Verify In List
    [Documentation]    Click Programmer, wait for success message,
    ...               verify the scheduled course appears in the list
    Submit Schedule Form
    Page Should Contain    ${COURS_TITRE}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — EXERCISES
# ═══════════════════════════════════════════════════════════════════════════════

18 - Navigate To Exercises
    [Documentation]    Professor opens the Exercices section
    Go To Exercises
    Page Should Contain Element    xpath://h1[contains(text(),'Exercice') or contains(text(),'Exercise')]

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — MESSAGES
# ═══════════════════════════════════════════════════════════════════════════════

19 - Navigate To Messages
    [Documentation]    Professor opens the Messagerie section
    Go To Messages
    Page Should Contain Element    xpath://h1[contains(text(),'Message')]
