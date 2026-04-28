*** Settings ***
Library     SeleniumLibrary
Resource    ../resources/common.resource

*** Keywords ***
Professor Login
    Open Browser To Login
    Login As    ${PROF_EMAIL}    ${PROF_PASSWORD}

# ── Matières ──────────────────────────────────────────────────────────────────

Go To Matieres
    Navigate To Sidebar Tab    Matières

Create Matiere
    [Arguments]    ${nom}    ${description}
    Open Modal And Wait    Nouvelle Matière    Nouvelle Matière
    Fill Modal Input    ${nom}
    Fill Modal Textarea    ${description}
    Submit Modal    Créer
    Wait Until Page Contains    ${nom}    timeout=10s

# ── Classes ───────────────────────────────────────────────────────────────────

Go To Create Class
    Navigate To Sidebar Dropdown Item    Classes    Créer une Classe
    Wait Until Page Contains Element    xpath://h1[contains(text(),'Créer une Classe') or contains(text(),'Create')]    timeout=10s

Fill Class Base Fields
    [Arguments]    ${nom}    ${niveau}
    Input Text    xpath://input[@name='nom']    ${nom}
    Select From List By Value    xpath://select[@name='niveau']    ${niveau}

Select Establishment
    [Arguments]    ${etab_name}
    Wait Until Element Is Enabled    xpath://select[@name='etablissement']    timeout=10s
    Select From List By Label    xpath://select[@name='etablissement']    ${etab_name}
    Sleep    1s

Select No Establishment
    Wait Until Element Is Enabled    xpath://select[@name='etablissement']    timeout=10s
    Select From List By Index    xpath://select[@name='etablissement']    0

Fill Code Unique
    [Arguments]    ${code}
    Wait Until Page Contains Element    xpath://input[@name='codeUnique']    timeout=5s
    Input Text    xpath://input[@name='codeUnique']    ${code}

Select Moderator By Name
    [Arguments]    ${full_name}
    Wait Until Element Is Enabled    xpath://select[@name='moderator']    timeout=10s
    Select From List By Label    xpath://select[@name='moderator']    ${full_name}

Submit Class Form
    Click Element    xpath://button[@type='submit']

Complete Payment With Orange Money
    [Arguments]    ${phone}
    # Step 1 - payment method selection screen
    Wait Until Page Contains Element    xpath://button[contains(.,'Orange Money')]    timeout=10s
    Click Element    xpath://button[contains(.,'Orange Money')]
    # Step 2 - phone number form
    Wait Until Page Contains Element    xpath://input[@type='tel']    timeout=5s
    Input Text    xpath://input[@type='tel']    ${phone}
    Click Element    xpath://button[contains(.,'Payer')]
    # Step 3+4 - processing then success
    Wait Until Page Contains    Paiement accepté    timeout=15s

Wait For Class Creation Success
    Wait Until Page Contains    créée avec succès    timeout=20s

Go To Manage Class
    Navigate To Sidebar Dropdown Item    Classes    Gérer une Classe
    Wait Until Page Contains Element    xpath://h1[contains(text(),'Classe') or contains(text(),'Class')]    timeout=10s

# ── Cours ─────────────────────────────────────────────────────────────────────

Go To Courses
    Navigate To Sidebar Dropdown Item    Gérer les Cours    Cours

# ── Exercices ─────────────────────────────────────────────────────────────────

Go To Exercises
    Navigate To Sidebar Tab    Exercices

# ── Messages ──────────────────────────────────────────────────────────────────

Go To Messages
    Navigate To Sidebar Tab    Messages
