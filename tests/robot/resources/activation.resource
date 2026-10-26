*** Settings ***
Library     Process
Library     SeleniumLibrary
Library     String
Resource    ../resources/common.resource

*** Variables ***
# Local dev database (docker containers scholchat-postgres / minio started separately)
${DB_HOST}          localhost
${DB_NAME}          scholchat
${DB_USER}          scholchat_user
${DB_PASSWORD}      StrongPassword123

*** Keywords ***
Get Activation Token From Database
    [Documentation]    Dev-environment shortcut: reads the activation token straight from
    ...    Postgres instead of an inbox, since it is the exact same token the real
    ...    activation email would contain. Requires local psql + DB access.
    [Arguments]    ${email}
    # The "=" in the SQL below must be escaped: Run Process treats any bare "key=value"
    # argument as a named option (that's how env:PGPASSWORD=... below is meant to work).
    ${result}=    Run Process
    ...    psql    -h    ${DB_HOST}    -U    ${DB_USER}    -d    ${DB_NAME}
    ...    -t    -A    -c
    ...    SELECT activation_token FROM ressources.utilisateurs WHERE email\='${email}';
    ...    env:PGPASSWORD=${DB_PASSWORD}
    Should Be Equal As Integers    ${result.rc}    0    msg=psql query failed: ${result.stderr}
    ${token}=    Strip String    ${result.stdout}
    Should Not Be Empty    ${token}    msg=No activation token found in DB for ${email}
    RETURN    ${token}

Activate Account Via Token
    [Documentation]    Opens the account-activation link (same URL/token the professor would
    ...    receive by email) and waits for the success screen.
    [Arguments]    ${email}
    ${token}=    Get Activation Token From Database    ${email}
    Go To    ${BASE_URL}/schoolchat/account-activation?activationToken=${token}
    Wait Until Page Contains    Succès    timeout=20s

Set New Account Password
    [Documentation]    From the activation success screen: click through to the password page
    ...    and set the given password (in-app navigation, so the router state carrying the
    ...    email/token survives — do NOT reload or Go To this page directly).
    [Arguments]    ${new_password}
    Click Element    xpath://button[contains(.,'mot de passe')]
    Wait Until Page Contains Element    xpath://input[@placeholder='Minimum 8 caractères']    timeout=15s
    Input Text    xpath://input[@placeholder='Minimum 8 caractères']    ${new_password}
    Input Text    xpath://input[@placeholder='Répétez votre mot de passe']    ${new_password}
    Click Element    xpath://button[contains(.,'Valider mon profil')]
    Wait Until Page Contains    défini avec succès    timeout=15s
    Wait Until Location Contains    /schoolchat/login    timeout=10s
