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
${MATIERE_DESC}             Algèbre et géométrie - cours de 3ème trimestre

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

# Course
${COURS_TITRE}              ${EMPTY}
${COURS_DESC}               Ce cours couvre les fondamentaux de l'algèbre : équations, inéquations et systèmes. Il s'adresse aux élèves de 3ème préparant le brevet.
${CHAPITRE1_TITRE}          Les équations du premier degré
${CHAPITRE1_DESC}           Méthodes de résolution des équations ax + b = 0
${CHAPITRE1_CONTENU}        Une équation du premier degré est de la forme ax + b = 0. Pour la résoudre, on isole x en soustrayant b puis en divisant par a.
${CHAPITRE2_TITRE}          Les systèmes d'équations
${CHAPITRE2_DESC}           Résolution par substitution et par addition
${CHAPITRE2_CONTENU}        Un système de deux équations à deux inconnues se résout par substitution ou par combinaison linéaire des deux équations.

# Schedule
${SCHEDULE_LIEU}            Salle 203 - Bâtiment des Sciences
${SCHEDULE_DESC}            Séance de cours en présentiel avec exercices pratiques
${SCHEDULE_DATE}            ${EMPTY}

# Exercise
${EXERCISE_NOM}             Contrôle de Mathématiques - Algèbre 3ème
${EXERCISE_DESC}            Exercice portant sur la résolution d'équations du premier degré, les inéquations et les systèmes d'équations. Objectif : vérifier la maîtrise des techniques de calcul algébrique.
${EXERCISE_NIVEAU}          3ème

*** Keywords ***
Initialise Unique Names
    ${ts}=    Get Current Date    result_format=%H%M%S
    Set Suite Variable    ${TIMESTAMP}       ${ts}
    Set Suite Variable    ${MATIERE_NOM}     Mathématiques ${ts}
    Set Suite Variable    ${CLASS1_NOM}      Classe 3A Robot ${ts}
    Set Suite Variable    ${CLASS2_NOM}      Classe 6B Robot ${ts}
    Set Suite Variable    ${COURS_TITRE}     Algèbre - Équations Robot ${ts}
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
    [Documentation]    Scroll to each class and verify their states:
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
    [Documentation]    Professor opens the Cours section
    Go To Courses
    Page Should Contain    Mes Cours

10 - Click Nouveau Cours Button
    [Documentation]    Professor clicks the Nouveau Cours button
    Click Nouveau Cours

11 - Fill Course General Information
    [Documentation]    Fill title, visibility PUBLIC, description and select the matière
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
    [Documentation]    Submit the course form and verify it appears in the list
    Submit Course Form
    Page Should Contain    ${COURS_TITRE}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — PROGRAMMER LE COURS
# ═══════════════════════════════════════════════════════════════════════════════

15 - Navigate To Schedule Course
    [Documentation]    Professor navigates to the Programmer le Cours section
    Go To Schedule Course

16 - Open Programmer Form And Fill
    [Documentation]    Open form, select course + class, set PLANIFIE, fill date/lieu/description
    Open Programmer Form
    Fill Schedule Form
    ...    ${COURS_TITRE}
    ...    ${CLASS2_NOM}
    ...    ${SCHEDULE_DATE}
    ...    ${SCHEDULE_LIEU}
    ...    ${SCHEDULE_DESC}

17 - Submit Schedule And Verify In List
    [Documentation]    Click Programmer, wait for success, verify modal closes
    Submit Schedule Form
    Page Should Contain    ${COURS_TITRE}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — EXERCISES : open page only, do NOT create a new exercise
# ═══════════════════════════════════════════════════════════════════════════════

18 - Navigate To Exercises
    [Documentation]    Professor opens the Exercices section — no new exercise is created
    Go To Exercises

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — MESSAGES
# ═══════════════════════════════════════════════════════════════════════════════

19 - Navigate To Messages
    [Documentation]    Professor navigates to the Messagerie section from the sidebar
    Go To Messages
    Page Should Contain Element    xpath://h1[contains(text(),'Message')]

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 8 — LOGOUT
# ═══════════════════════════════════════════════════════════════════════════════

20 - Logout Professor
    [Documentation]    Click the logout button in the sidebar and confirm in the modal
    Logout
    Wait Until Location Contains    /schoolchat/login    timeout=15s
