*** Settings ***
Library       SeleniumLibrary
Library       DateTime
Resource      ../resources/common.resource
Resource      ../resources/admin.resource
Suite Setup   Admin Login
Suite Teardown    Close Browser

*** Variables ***
# Activity (événement) data
${ACTIVITY_TITRE}       ${EMPTY}
${ACTIVITY_DESC}        Réunion de rentrée pour présenter le programme de l'année scolaire aux parents et aux élèves.
${ACTIVITY_LIEU}        Salle Polyvalente - Bâtiment Principal
${ACTIVITY_DEBUT}       ${EMPTY}
${ACTIVITY_FIN}         ${EMPTY}

# Class to approve — name created by the professor in the previous suite
# (CLASS1_NOM pattern: "Classe 3A Robot <timestamp>")
# We search by "En attente" status and pick the first pending class with an établissement
${CLASS_TO_APPROVE}     ${EMPTY}

*** Keywords ***
Initialise Admin Data
    ${ts}=    Get Current Date    result_format=%H%M%S
    Set Suite Variable    ${ACTIVITY_TITRE}    Réunion de Rentrée Robot ${ts}
    ${debut}=    Get Current Date    increment=2 days    result_format=%Y-%m-%dT09:00
    ${fin}=      Get Current Date    increment=2 days    result_format=%Y-%m-%dT11:00
    Set Suite Variable    ${ACTIVITY_DEBUT}    ${debut}
    Set Suite Variable    ${ACTIVITY_FIN}      ${fin}

*** Test Cases ***

# ═══════════════════════════════════════════════════════════════════════════════
# SETUP
# ═══════════════════════════════════════════════════════════════════════════════

00 - Initialise Admin Data
    [Documentation]    Generate unique names for the admin test run
    Initialise Admin Data
    Log    Activity: ${ACTIVITY_TITRE}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — ADMIN LANDS ON ACTIVITIES PAGE AND CREATES AN ÉVÉNEMENT
# ═══════════════════════════════════════════════════════════════════════════════

01 - Verify Activities Page On Login
    [Documentation]    After admin login the dashboard loads; navigate to Activities tab
    Go To Activities
    Page Should Contain Element    xpath://h1[contains(text(),'Fil') or contains(text(),'Activit')]

02 - Open Create Event Form
    [Documentation]    Click the "Créer un événement" button in the left sidebar of the activities page
    Open Create Event Form

03 - Fill Event Form
    [Documentation]    Fill all required fields: titre, description, lieu, heureDebut, heureFin
    Fill Event Form
    ...    ${ACTIVITY_TITRE}
    ...    ${ACTIVITY_DESC}
    ...    ${ACTIVITY_LIEU}
    ...    ${ACTIVITY_DEBUT}
    ...    ${ACTIVITY_FIN}

04 - Submit Event And Verify
    [Documentation]    Click "Publier l'Événement" and verify the new event appears in the feed
    Submit Event Form
    Wait Until Page Contains    ${ACTIVITY_TITRE}    timeout=15s

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — NAVIGATE TO GÉRER UNE CLASSE
# ═══════════════════════════════════════════════════════════════════════════════

05 - Navigate To Manage Class
    [Documentation]    Admin opens the Classes → Gérer une Classe section from the sidebar
    Go To Admin Manage Class
    Page Should Contain    Gestion des Classes

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — FIND THE PENDING CLASS (with établissement) AND CLICK GÉRER
# ═══════════════════════════════════════════════════════════════════════════════

06 - Click Gerer On Pending Class With Etablissement
    [Documentation]    Find the first class card with status "En attente" that has an
    ...               établissement (created by the professor) and click its Gérer button
    Click Gerer On First Pending Class

07 - Verify Class Details Page Loaded
    [Documentation]    Confirm the class details view is displayed
    Page Should Contain    Gestion de la classe

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — CLICK APPROUVER IN THE DETAILS
# ═══════════════════════════════════════════════════════════════════════════════

08 - Click Approuver Button
    [Documentation]    Click the "Approuver" button in the action buttons card
    Click Approuver Button
    Wait Until Page Contains    approuvée avec succès    timeout=15s

09 - Verify Class Is Now Active
    [Documentation]    After approval the status tag should change to Actif
    Page Should Contain Element    xpath://span[contains(@class,'ant-tag') and contains(text(),'Actif')]

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — NAVIGATE TO LIST OF ÉTABLISSEMENTS
# ═══════════════════════════════════════════════════════════════════════════════

10 - Navigate To Manage Establishment
    [Documentation]    Admin opens the Établissements → Gérer un Établissement section
    Go To Admin Manage Establishment
    Page Should Contain    Gestion des Établissements
