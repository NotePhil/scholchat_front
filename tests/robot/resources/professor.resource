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

Open Classes Dropdown
    ${visible}=    Run Keyword And Return Status
    ...    Page Should Contain Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Créer une Classe']
    Run Keyword If    not ${visible}
    ...    Click Element    xpath://div[contains(@class,'dropdown-header')]//span[@class='menu-text' and text()='Classes']/ancestor::div[contains(@class,'dropdown-header')]
    Sleep    0.3s

Go To Create Class
    Open Classes Dropdown
    Wait Until Page Contains Element    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Créer une Classe']    timeout=5s
    Click Element    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Créer une Classe']/ancestor::li
    Wait Until Page Contains Element    xpath://input[@name='nom']    timeout=10s

Go To Manage Class
    Open Classes Dropdown
    Wait Until Page Contains Element    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Gérer une Classe']    timeout=5s
    Click Element    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Gérer une Classe']/ancestor::li
    Wait Until Page Contains    Gestion des Classes    timeout=10s

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

Wait For Class Creation Success
    Wait Until Page Contains    créée avec succès    timeout=20s
    Wait Until Page Contains    Gestion des Classes    timeout=15s

Scroll To Class Card
    [Arguments]    ${class_name}
    Wait Until Page Contains    ${class_name}    timeout=10s
    Execute Javascript
    ...    var els = document.querySelectorAll('.class-name');
    ...    for(var e of els){ if(e.textContent.trim().includes('${class_name}')){ e.scrollIntoView({block:'center'}); break; } }
    Sleep    0.5s

Complete Payment With Orange Money
    [Arguments]    ${phone}
    Wait Until Page Contains Element    xpath://button[contains(.,'Orange Money')]    timeout=10s
    Click Element    xpath://button[contains(.,'Orange Money')]
    Wait Until Page Contains Element    xpath://input[@type='tel']    timeout=5s
    Input Text    xpath://input[@type='tel']    ${phone}
    Click Element    xpath://button[contains(.,'Payer')]
    Wait Until Page Contains    Paiement accepté    timeout=15s

# ── Cours ─────────────────────────────────────────────────────────────────────

Open Courses Dropdown
    ${visible}=    Run Keyword And Return Status
    ...    Page Should Contain Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Cours']
    Run Keyword If    not ${visible}
    ...    Click Element    xpath://div[contains(@class,'dropdown-header')]//span[@class='menu-text' and text()='Gérer les Cours']/ancestor::div[contains(@class,'dropdown-header')]
    Sleep    0.3s

Go To Courses
    Open Courses Dropdown
    Wait Until Page Contains Element    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Cours']    timeout=5s
    Click Element    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Cours']/ancestor::li
    Wait Until Page Contains    Mes Cours    timeout=10s

Click Nouveau Cours
    Wait Until Page Contains Element    xpath://button[contains(.,'Nouveau Cours')]    timeout=10s
    Click Element    xpath://button[contains(.,'Nouveau Cours')]
    Wait Until Page Contains Element    xpath://input[@placeholder='Introduction à la programmation']    timeout=10s

Fill Course General Info
    [Arguments]    ${titre}    ${description}    ${matiere_nom}
    Input Text    xpath://input[@placeholder='Introduction à la programmation']    ${titre}
    Select From List By Value    xpath://select[.//option[text()='Privé']]    PUBLIC
    Input Text    xpath://textarea[@placeholder='Décrivez le contenu général de ce cours...']    ${description}
    Click Element    xpath://button[.//span[contains(@class,'text-slate-400') and contains(text(),'Sélectionnez les matières')]]
    Wait Until Page Contains Element    xpath://div[contains(@class,'absolute')]//span[text()='${matiere_nom}']    timeout=5s
    Click Element    xpath://div[contains(@class,'absolute')]//span[text()='${matiere_nom}']
    Wait Until Page Contains    ${matiere_nom}    timeout=5s

Add Chapter
    [Arguments]    ${titre}    ${description}    ${contenu}
    Click Element    xpath://button[.//span[contains(text(),'Nouveau chapitre')] or .//span[text()='Nouveau']]
    Wait Until Page Contains Element    xpath://input[@placeholder='Titre du chapitre']    timeout=5s
    Input Text    xpath://input[@placeholder='Titre du chapitre']    ${titre}
    Input Text    xpath://textarea[@placeholder='Description du chapitre']    ${description}
    Click Element    xpath://div[@contenteditable='true']
    Input Text    xpath://div[@contenteditable='true']    ${contenu}
    Click Element    xpath://button[contains(.,'Ajouter')]
    Wait Until Page Does Not Contain Element    xpath://input[@placeholder='Titre du chapitre']    timeout=5s

Submit Course Form
    Click Element    xpath://button[contains(.,'Créer le cours')]
    Wait Until Page Contains    Cours créé avec succès    timeout=15s
    Wait Until Page Contains    Mes Cours    timeout=10s

# ── Programmer le Cours ────────────────────────────────────────────────────────

Go To Schedule Course
    Go To    https://scholchat-front-kult.onrender.com/schoolchat/Principal/ProfessorDashboard/schedule-course
    Wait Until Page Contains    Programmation des Cours    timeout=15s

Open Programmer Form
    Wait Until Page Contains Element    xpath://button[.//span[contains(text(),'Programmer un Cours')]]    timeout=10s
    Click Element    xpath://button[.//span[contains(text(),'Programmer un Cours')]]
    Wait Until Page Contains Element    xpath://select[@id='coursId']    timeout=10s

Fill Schedule Form
    [Arguments]    ${cours_titre}    ${classe_nom}    ${date_prevue}    ${lieu}    ${description}
    Select From List By Label    xpath://select[@id='coursId']    ${cours_titre}
    Select From List By Value    xpath://select[@id='etatCoursProgramme']    PLANIFIE
    Select From List By Label    xpath://select[@id='classeId']    ${classe_nom}
    Sleep    1s
    Execute Javascript
    ...    var input = document.getElementById('dateCoursPrevue');
    ...    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    ...    setter.call(input, '${date_prevue}');
    ...    input.dispatchEvent(new Event('input', {bubbles:true}));
    ...    input.dispatchEvent(new Event('change', {bubbles:true}));
    Sleep    0.5s
    Input Text    xpath://input[@id='lieu']    ${lieu}
    Input Text    xpath://textarea[@id='description']    ${description}

Submit Schedule Form
    Click Element    xpath://button[@form='course-form'][.//span[contains(text(),'Programmer')]]
    Wait Until Page Contains    programmé avec succès    timeout=15s
    Wait Until Page Does Not Contain Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0') and contains(@class,'z-[9999]')]    timeout=10s
    Sleep    0.5s

# ── Exercises ─────────────────────────────────────────────────────────────────

Go To Exercises
    Navigate To Sidebar Tab    Exercices
    Wait Until Page Contains    Exercices    timeout=10s

Open New Exercise Form
    Wait Until Page Contains Element    xpath://button[.//span[contains(text(),'Nouveau')]]    timeout=10s
    Click Element    xpath://button[.//span[contains(text(),'Nouveau')]]
    Wait Until Page Contains    Créer un Nouvel Exercice    timeout=10s

# Ant Design v6: input[@id='X'] is inside ant-select-content
# The clickable outer div is 2 levels up: ant-select-content -> ant-select
# Options render in a portal with class ant-select-item-option-content

Open Ant Select
    [Arguments]    ${input_id}
    # ant-select-content is direct parent, ant-select is grandparent
    Click Element    xpath://input[@id='${input_id}']/parent::div/parent::div[contains(@class,'ant-select')]
    Sleep    0.5s

Pick Ant Option
    [Arguments]    ${text}
    # Options use @title attribute on the ant-select-item-option div
    Wait Until Page Contains Element    xpath://div[contains(@class,'ant-select-item-option') and @title='${text}']    timeout=8s
    Click Element    xpath://div[contains(@class,'ant-select-item-option') and @title='${text}']
    Sleep    0.3s

Fill Exercise Info
    [Arguments]    ${nom}    ${niveau}    ${description}    ${matiere_nom}
    # Nom
    Wait Until Page Contains Element    xpath://input[@placeholder='Ex: Exercice de Mathématiques']    timeout=5s
    Input Text    xpath://input[@placeholder='Ex: Exercice de Mathématiques']    ${nom}
    # Niveau
    Open Ant Select    niveau
    Pick Ant Option    ${niveau}
    # Restriction already PRIVE by default
    # Matières - type in search to filter then pick
    Open Ant Select    matiereIds
    Input Text    xpath://input[@id='matiereIds']    ${matiere_nom}
    Sleep    0.5s
    Pick Ant Option    ${matiere_nom}
    Press Keys    None    ESCAPE
    Sleep    0.3s
    # Description
    Input Text    xpath://textarea[@placeholder="Décrivez l'exercice en détail..."]    ${description}

Set Question Intitule
    [Arguments]    ${text}
    Wait Until Page Contains Element    xpath://textarea[@placeholder='Posez votre question ici...']    timeout=5s
    Clear Element Text    xpath://textarea[@placeholder='Posez votre question ici...']
    Input Text    xpath://textarea[@placeholder='Posez votre question ici...']    ${text}

Set Question Type
    [Arguments]    ${type_value}
    Click Element    xpath://div[contains(@class,'ant-select-content-value') and (contains(.,'QCM') or contains(.,'Vrai') or contains(.,'Réponse') or contains(.,'Association') or contains(.,'Classement') or contains(.,'Trous') or contains(.,'Développement'))]/parent::div/parent::div[contains(@class,'ant-select')]
    Wait Until Page Contains Element    xpath://div[contains(@class,'ant-select-item-option') and @data-value='${type_value}']    timeout=5s
    Click Element    xpath://div[contains(@class,'ant-select-item-option') and @data-value='${type_value}']
    Sleep    0.5s

Fill QCM Choice
    [Arguments]    ${index}    ${text}    ${is_correct}
    Wait Until Page Contains Element    xpath://input[@placeholder='Choix ${index}']    timeout=5s
    Clear Element Text    xpath://input[@placeholder='Choix ${index}']
    Input Text    xpath://input[@placeholder='Choix ${index}']    ${text}
    Run Keyword If    '${is_correct}' == 'true'
    ...    Execute Javascript    document.querySelectorAll('input[type="checkbox"]')[${index}-1].click()

Fill Choice Input
    [Arguments]    ${index}    ${text}
    ${xpath}=    Set Variable    xpath:(//input[contains(@placeholder,'Ex: France') or contains(@placeholder,'lément') or contains(@placeholder,'Mot/Expression')])[${index}]
    Wait Until Page Contains Element    ${xpath}    timeout=5s
    Clear Element Text    ${xpath}
    Input Text    ${xpath}    ${text}

Add Question Button
    Click Element    xpath://button[contains(.,'Ajouter la question') or contains(.,'Mettre à jour la question')]
    Wait Until Page Contains    Question ajoutée    timeout=5s

Select Vrai Faux
    [Arguments]    ${choice}
    Wait Until Page Contains Element    xpath://button[contains(@class,'flex-1') and contains(.,'${choice}')]    timeout=5s
    Click Element    xpath://button[contains(@class,'flex-1') and contains(.,'${choice}')]

Set Short Answer
    [Arguments]    ${answer}
    Wait Until Page Contains Element    xpath://input[@placeholder='Ex: H2O']    timeout=5s
    Input Text    xpath://input[@placeholder='Ex: H2O']    ${answer}

Set Long Answer
    [Arguments]    ${answer}
    Wait Until Page Contains Element    xpath://textarea[@placeholder='Décrivez la réponse attendue...']    timeout=5s
    Input Text    xpath://textarea[@placeholder='Décrivez la réponse attendue...']    ${answer}

Submit Exercise Form
    Click Element    xpath://button[@type='submit' and contains(.,'Exercice')]
    Wait Until Page Contains    Exercice créé avec succès    timeout=15s

# ── Messages ──────────────────────────────────────────────────────────────────

Go To Messages
    Navigate To Sidebar Tab    Messagerie
