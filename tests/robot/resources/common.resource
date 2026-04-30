*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${BASE_URL}         https://scholchat-front-kult.onrender.com
${LOGIN_URL}        ${BASE_URL}/schoolchat/login
${BROWSER}          Chrome
${SPEED}            0.3s

# Professor credentials
${PROF_EMAIL}       kpgpa237@gmail.com
${PROF_PASSWORD}    password123

*** Keywords ***
Open Browser To Login
    Open Browser    ${LOGIN_URL}    ${BROWSER}
    Maximize Browser Window
    Set Selenium Speed    ${SPEED}
    Wait Until Page Contains Element    id:email    timeout=30s
    Sleep    1s

Login As
    [Arguments]    ${email}    ${password}
    Input Text      id:email      ${email}
    Input Text      id:password   ${password}
    Click Button    xpath://button[@type='submit']
    Wait Until Location Contains    /schoolchat/Principal    timeout=30s
    Wait Until Page Contains Element    css:.principal-container    timeout=20s

Navigate To Sidebar Tab
    [Arguments]    ${label}
    Click Element    xpath://span[@class='menu-text' and contains(text(),'${label}')]/ancestor::li
    Sleep    1s

Navigate To Sidebar Dropdown Item
    [Arguments]    ${dropdown_label}    ${item_label}
    Click Element    xpath://span[@class='menu-text' and contains(text(),'${dropdown_label}')]/ancestor::div[contains(@class,'dropdown-header')]
    Wait Until Page Contains Element    xpath://span[@class='menu-text' and contains(text(),'${item_label}')]    timeout=5s
    Click Element    xpath://span[@class='menu-text' and contains(text(),'${item_label}')]/ancestor::li

Open Modal And Wait
    [Arguments]    ${button_text}    ${modal_title}
    Wait Until Page Contains Element    xpath://button[contains(.,'${button_text}')]    timeout=10s
    Click Element    xpath://button[contains(.,'${button_text}')]
    Wait Until Page Contains Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]    timeout=5s

Fill Modal Input
    [Arguments]    ${value}
    Wait Until Page Contains Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//input[@placeholder]    timeout=5s
    Input Text    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//input[@placeholder]    ${value}

Fill Modal Textarea
    [Arguments]    ${value}
    Input Text    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//textarea    ${value}

Submit Modal
    [Arguments]    ${button_text}
    Click Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]//button[contains(.,'${button_text}')]
    Wait Until Page Does Not Contain Element    xpath://div[contains(@class,'fixed') and contains(@class,'inset-0')]    timeout=10s

Logout
    Click Element    xpath://button[contains(@class,'logout-button')]
    Wait Until Page Contains Element    xpath://button[contains(@class,'modal-custom') or contains(.,'Confirmer') or contains(.,'Confirm')]    timeout=5s
    Click Element    xpath://button[contains(.,'Confirmer') or contains(.,'Confirm')]
    Wait Until Location Contains    /schoolchat/login    timeout=10s

Scroll Element Into View
    [Arguments]    ${locator}
    Execute Javascript    document.evaluate("${locator}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.scrollIntoView({behavior: 'smooth', block: 'center'})
