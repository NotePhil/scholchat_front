*** Settings ***
Library       SeleniumLibrary
Suite Setup   Open Browser    http://localhost:3000/schoolchat/login    Chrome
Suite Teardown    Close Browser

*** Test Cases ***
Debug Ant Select Options
    Set Selenium Speed    0.5s
    Maximize Browser Window
    Wait Until Page Contains Element    id:email    timeout=15s
    Input Text    id:email    kpgpa237@gmail.com
    Input Text    id:password    password123
    Click Button    xpath://button[@type='submit']
    Wait Until Location Contains    /schoolchat/Principal    timeout=20s
    Go To    http://localhost:3000/schoolchat/Principal/ProfessorDashboard/manage-exercises
    Wait Until Page Contains    Exercices    timeout=15s
    Sleep    2s
    Click Element    xpath://button[.//span[contains(text(),'Nouveau')]]
    Wait Until Page Contains    Créer un Nouvel Exercice    timeout=10s
    Sleep    2s

    # Click niveau select - 2 levels up from input
    Click Element    xpath://input[@id='niveau']/parent::div/parent::div[contains(@class,'ant-select')]
    Sleep    1s

    # Get all elements with ant-select-item in class
    ${items}=    Get WebElements    xpath://*[contains(@class,'ant-select-item')]
    Log    Found ${items.__len__()} ant-select-item elements
    FOR    ${item}    IN    @{items}
        ${html}=    Get Element Attribute    ${item}    outerHTML
        Log    ITEM: ${html[:200]}
    END

    # Also check body for any popup
    ${popups}=    Get WebElements    xpath://div[contains(@class,'ant-select-dropdown')]
    Log    Found ${popups.__len__()} dropdowns
    FOR    ${p}    IN    @{popups}
        ${html}=    Get Element Attribute    ${p}    outerHTML
        Log    DROPDOWN: ${html[:500]}
    END

    # Check aria-expanded
    ${expanded}=    Get Element Attribute    xpath://input[@id='niveau']    aria-expanded
    Log    aria-expanded: ${expanded}
