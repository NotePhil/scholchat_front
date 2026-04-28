*** Settings ***
Library           SeleniumLibrary
Suite Setup       Open Browser To Home Page
Suite Teardown    Close Browser
Test Setup        Go To Home Page

*** Variables ***
${URL}              http://localhost:3000
${BROWSER}          Chrome
${LOGIN_URL}        ${URL}/schoolchat/login
${SIGNUP_URL}       ${URL}/schoolchat/signup
${PROF_EMAIL}       kpgpa237@gmail.com
${PROF_PASSWORD}    password123
${MATIERE_NAME}     Matière Robot Test
${MATIERE_DESC}     Matière créée par test automatisé Robot Framework

*** Test Cases ***
Home Page Should Load
    [Documentation]    Verify home page loads successfully
    Title Should Contain    SchoolChat
    Page Should Contain Element    css:header

Navigate To Login Page
    [Documentation]    Test navigation to login page
    Click Element    xpath://a[@href='/schoolchat/login']
    Location Should Be    ${LOGIN_URL}
    Page Should Contain Element    id:email

Login With Valid Credentials
    [Documentation]    Test login with valid credentials redirects to dashboard
    Go To    ${LOGIN_URL}
    Input Text    id:email    test@example.com
    Input Text    id:password    testpassword123
    Click Button    xpath://button[@type='submit']
    Wait Until Location Contains    /schoolchat/Principal    timeout=10s

Login With Invalid Credentials Shows Error
    [Documentation]    Test login with wrong credentials shows error message
    Go To    ${LOGIN_URL}
    Input Text    id:email    wrong@example.com
    Input Text    id:password    wrongpassword
    Click Button    xpath://button[@type='submit']
    Wait Until Page Contains Element    css:.bg-red-50    timeout=5s

Navigate To Signup Page
    [Documentation]    Test navigation to signup page
    Click Element    xpath://a[@href='/schoolchat/signup']
    Location Should Be    ${SIGNUP_URL}
    Page Should Contain Element    name:prenom

Fill Signup Form Step 1
    [Documentation]    Test signup form step 1 advances to step 2
    Go To    ${SIGNUP_URL}
    Input Text    name:prenom    Jean
    Input Text    name:nom    Dupont
    Input Text    name:email    jean.dupont@test.com
    Input Text    name:adresse    Yaoundé, Cameroun
    Click Button    xpath://button[contains(text(), 'Suivant')]
    Wait Until Page Contains Element    name:type    timeout=5s

Signup Step 2 Select Account Type
    [Documentation]    Test selecting account type on step 2
    Go To    ${SIGNUP_URL}
    Input Text    name:prenom    Jean
    Input Text    name:nom    Dupont
    Input Text    name:email    jean.dupont@test.com
    Input Text    name:adresse    Yaoundé, Cameroun
    Click Button    xpath://button[contains(text(), 'Suivant')]
    Wait Until Page Contains Element    name:type    timeout=5s
    Click Element    xpath://input[@name='type' and @value='parent']
    Element Should Be Visible    xpath://input[@name='type' and @value='parent' and @checked]

Forgot Password Link Is Accessible
    [Documentation]    Test forgot password link navigates correctly
    Go To    ${LOGIN_URL}
    Click Element    xpath://a[@href='/schoolchat/forgot-password']
    Location Should Contain    forgot-password

Header Navigation Products Dropdown
    [Documentation]    Test products dropdown appears on hover
    Mouse Over    xpath://button[contains(@class, 'flex') and .//span[contains(text(), 'Produits') or contains(text(), 'Products')]]
    Wait Until Page Contains Element    css:.rounded-2xl.shadow-2xl    timeout=3s

Professor Can Create A Matiere
    [Documentation]    Full end-to-end scenario: professor logs in, navigates to Matières, creates a new matière, and verifies it appears in the list
    # Step 1 - Login as professor
    Login As Professor
    # Step 2 - Navigate to Matières section via sidebar
    Navigate To Matieres Section
    # Step 3 - Open create modal
    Wait Until Page Contains Element    xpath://button[contains(.,'Nouvelle Matière') or contains(.,'New Subject')]    timeout=10s
    Click Element    xpath://button[contains(.,'Nouvelle Matière') or contains(.,'New Subject')]
    # Step 4 - Fill in the form
    Wait Until Page Contains Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//input[@placeholder]    timeout=5s
    Input Text    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//input[@placeholder]    ${MATIERE_NAME}
    Input Text    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//textarea    ${MATIERE_DESC}
    # Step 5 - Submit
    Click Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//button[contains(.,'Créer')]
    # Step 6 - Modal should close and matière appears in the table
    Wait Until Page Does Not Contain Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]    timeout=10s
    Wait Until Page Contains    ${MATIERE_NAME}    timeout=10s

*** Keywords ***
Open Browser To Home Page
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Speed    0.3s

Go To Home Page
    Go To    ${URL}
    Wait Until Page Contains Element    css:header    timeout=30s

Login As Professor
    Go To    ${LOGIN_URL}
    Wait Until Page Contains Element    id:email    timeout=30s
    Sleep    1s
    Input Text    id:email    ${PROF_EMAIL}
    Input Text    id:password    ${PROF_PASSWORD}
    Click Button    xpath://button[@type='submit']
    Wait Until Location Contains    /schoolchat/Principal    timeout=30s
    Wait Until Page Contains Element    css:.principal-container    timeout=20s

Navigate To Matieres Section
    Click Element    xpath://span[@class='menu-text' and (contains(text(),'Matières') or contains(text(),'Subjects'))]/ancestor::li
    Wait Until Page Contains Element    xpath://h1[contains(text(),'Matières') or contains(text(),'Subjects')]    timeout=10s
