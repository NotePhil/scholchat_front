*** Settings ***
Library     SeleniumLibrary
Library     OperatingSystem
Resource    ../resources/common.resource

*** Variables ***
${SIGNUP_URL}       ${BASE_URL}/schoolchat/signup
${FIXTURES_DIR}     ${CURDIR}/../fixtures
${CNI_RECTO}        ${FIXTURES_DIR}/cni_recto.jpg
${CNI_VERSO}        ${FIXTURES_DIR}/cni_verso.jpg
${SELFIE}           ${FIXTURES_DIR}/selfie.jpg

*** Keywords ***
Open Signup Page
    Go To    ${SIGNUP_URL}
    Wait Until Page Contains Element    xpath://input[@name='prenom']    timeout=20s

Fill Signup Identity
    [Documentation]    Step 1: prénom, nom, email, téléphone, adresse. Then click Suivant.
    [Arguments]    ${prenom}    ${nom}    ${email}    ${phone_national}    ${adresse}
    Input Text    xpath://input[@name='prenom']    ${prenom}
    Input Text    xpath://input[@name='nom']    ${nom}
    Input Text    xpath://input[@name='email']    ${email}
    Input Text    xpath://input[contains(@class,'PhoneInputInput')]    ${phone_national}
    Input Text    xpath://input[@name='adresse']    ${adresse}
    Click Element    xpath://button[contains(.,'Suivant')]
    Wait Until Page Contains    Type de compte    timeout=10s

Select Account Type Professeur
    [Documentation]    Step 2: pick "Professeur" and move to the documents step.
    Click Element    xpath://input[@name='type' and @value='professeur']/parent::label
    Click Element    xpath://button[contains(.,'Suivant')]
    Wait Until Page Contains    CNI Recto    timeout=10s

Fill Professor Documents And Submit
    [Documentation]    Step 3: optional matricule + the 3 required document uploads, then Terminer.
    [Arguments]    ${matricule}=${EMPTY}
    Run Keyword If    '${matricule}' != '${EMPTY}'
    ...    Input Text    xpath://input[@name='matriculeProfesseur']    ${matricule}
    # chromedriver rejects "path is not canonical" for paths containing "..", so resolve
    # these to absolute paths before handing them to Choose File.
    ${cni_recto}=    Normalize Path    ${CNI_RECTO}
    ${cni_verso}=    Normalize Path    ${CNI_VERSO}
    ${selfie}=       Normalize Path    ${SELFIE}
    # Each upload replaces its own <label><input type=file></label> with an <img> preview,
    # so the next pending upload is always the first remaining file input in the DOM.
    Choose File    xpath:(//input[@type='file'])[1]    ${cni_recto}
    Wait Until Page Contains Element    xpath://img[@alt='CNI Recto']    timeout=10s
    Choose File    xpath:(//input[@type='file'])[1]    ${cni_verso}
    Wait Until Page Contains Element    xpath://img[@alt='CNI Verso']    timeout=10s
    Choose File    xpath:(//input[@type='file'])[1]    ${selfie}
    Wait Until Page Contains Element    xpath://img[@alt='Photo de profil']    timeout=10s
    Click Element    xpath://button[contains(.,'Terminer')]
    # The "Inscription réussie" alert is a transient toast fired right before an immediate
    # SPA navigation to /verify-email — it's gone (or the DOM has already moved on) by the
    # time Selenium can poll for it, so assert on the stable post-navigation page instead.
    Wait Until Location Contains    /schoolchat/verify-email    timeout=30s
    Wait Until Page Contains    Vérifiez votre e-mail    timeout=10s
