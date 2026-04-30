*** Settings ***
Library     SeleniumLibrary
Resource    ../resources/common.resource

*** Variables ***
${ADMIN_EMAIL}      admin@example.com
${ADMIN_PASSWORD}   password123

*** Keywords ***
Admin Login
    Open Browser To Login
    Login As    ${ADMIN_EMAIL}    ${ADMIN_PASSWORD}

# ── Activities ────────────────────────────────────────────────────────────────

Go To Activities
    Navigate To Sidebar Tab    Activités
    Wait Until Page Contains Element
    ...    xpath://h1[contains(text(),'Fil') or contains(text(),'Activit')]
    ...    timeout=10s

Open Create Event Form
    # Desktop: "Créer un evenement" button in the left sidebar of the activities page
    Wait Until Page Contains Element
    ...    xpath://button[contains(.,'Creer un evenement') or contains(.,'Créer un événement') or contains(.,'Créer un evenement')]
    ...    timeout=10s
    Click Element
    ...    xpath://button[contains(.,'Creer un evenement') or contains(.,'Créer un événement') or contains(.,'Créer un evenement')]
    Wait Until Page Contains Element
    ...    xpath://input[@placeholder='Ex: Réunion parents-professeurs' or contains(@placeholder,'événement')]
    ...    timeout=10s

Fill Event Form
    [Arguments]    ${titre}    ${description}    ${lieu}    ${heure_debut}    ${heure_fin}
    # Titre
    Wait Until Page Contains Element
    ...    xpath://input[@placeholder='Mon événement']
    ...    timeout=5s
    Clear Element Text    xpath://input[@placeholder='Mon événement']
    Input Text    xpath://input[@placeholder='Mon événement']    ${titre}
    # Description
    Wait Until Page Contains Element
    ...    xpath://textarea[@placeholder="Description de l'événement"]
    ...    timeout=5s
    Input Text    xpath://textarea[@placeholder="Description de l'événement"]    ${description}
    # Lieu
    Input Text    xpath://input[@placeholder='Salle de conférence']    ${lieu}
    # Visibilité — keep PUBLIC (default)
    # heureDebut
    Execute Javascript
    ...    var inp = document.querySelector('input[type="datetime-local"]');
    ...    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    ...    setter.call(inp, '${heure_debut}');
    ...    inp.dispatchEvent(new Event('input', {bubbles:true}));
    ...    inp.dispatchEvent(new Event('change', {bubbles:true}));
    Sleep    0.3s
    # heureFin
    Execute Javascript
    ...    var inputs = document.querySelectorAll('input[type="datetime-local"]');
    ...    if(inputs.length > 1){
    ...      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    ...      setter.call(inputs[1], '${heure_fin}');
    ...      inputs[1].dispatchEvent(new Event('input', {bubbles:true}));
    ...      inputs[1].dispatchEvent(new Event('change', {bubbles:true}));
    ...    }
    Sleep    0.3s

Submit Event Form
    # The sticky footer "Publier l'Événement" button
    Wait Until Page Contains Element
    ...    xpath://button[contains(.,"Publier") or contains(.,"Créer l'événement")]
    ...    timeout=10s
    Click Element
    ...    xpath://button[contains(.,"Publier") or contains(.,"Créer l'événement")]
    # Wait for the modal to close
    Wait Until Page Does Not Contain Element
    ...    xpath://h2[contains(text(),'Nouvel Événement')]
    ...    timeout=15s
    Sleep    1s

# ── Classes ───────────────────────────────────────────────────────────────────

Go To Admin Manage Class
    # Ensure the Classes dropdown is open, then click the sub-item li directly
    ${submenu_visible}=    Run Keyword And Return Status
    ...    Page Should Contain Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Gérer une Classe']
    Run Keyword If    not ${submenu_visible}
    ...    Click Element
    ...    xpath://div[contains(@class,'dropdown-header')]//span[@class='menu-text' and text()='Classes']/ancestor::div[contains(@class,'dropdown-header')]
    Wait Until Page Contains Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Gérer une Classe']
    ...    timeout=5s
    # Click the li element directly (onClick is on li, not span)
    Click Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//li[.//span[@class='menu-text' and text()='Gérer une Classe']]
    Wait Until Page Contains    Gestion des Classes    timeout=20s

Click Gerer On First Pending Class
    # Wait for the class cards to load
    Wait Until Page Contains Element    xpath://div[contains(@class,'class-card')]    timeout=15s
    # Find the first card that contains "En attente" status and click its Gérer button
    Wait Until Page Contains Element
    ...    xpath:(//div[contains(@class,'class-card') and .//*[contains(text(),'En attente')]]//button[contains(.,'Gérer')])[1]
    ...    timeout=10s
    Click Element
    ...    xpath:(//div[contains(@class,'class-card') and .//*[contains(text(),'En attente')]]//button[contains(.,'Gérer')])[1]
    Wait Until Page Contains    Gestion de la classe    timeout=15s

Click Approuver Button
    # The Approuver button rendered by renderActionButtons() in ManageClassDetailsView
    Wait Until Page Contains Element
    ...    xpath://button[.//span[contains(text(),'Approuver')] or contains(.,'Approuver')]
    ...    timeout=10s
    Click Element
    ...    xpath://button[.//span[contains(text(),'Approuver')] or contains(.,'Approuver')]

# ── Establishments ────────────────────────────────────────────────────────────

Go To Admin Manage Establishment
    # Ensure the Établissements dropdown is open, then click the sub-item li directly
    ${submenu_visible}=    Run Keyword And Return Status
    ...    Page Should Contain Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Gérer un Établissement']
    Run Keyword If    not ${submenu_visible}
    ...    Click Element
    ...    xpath://div[contains(@class,'dropdown-header')]//span[@class='menu-text' and text()='Établissements']/ancestor::div[contains(@class,'dropdown-header')]
    Wait Until Page Contains Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Gérer un Établissement']
    ...    timeout=5s
    # Click the li element directly (onClick is on li, not span)
    Click Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//li[.//span[@class='menu-text' and text()='Gérer un Établissement']]
    Wait Until Page Contains    Gestion des Établissements    timeout=20s

Open Admin Establishments Dropdown
    ${visible}=    Run Keyword And Return Status
    ...    Page Should Contain Element
    ...    xpath://ul[contains(@class,'dropdown-menu')]//span[@class='menu-text' and text()='Gérer un Établissement']
    Run Keyword If    not ${visible}
    ...    Click Element
    ...    xpath://div[contains(@class,'dropdown-header')]//span[@class='menu-text' and text()='Établissements']/ancestor::div[contains(@class,'dropdown-header')]
    Sleep    0.3s
