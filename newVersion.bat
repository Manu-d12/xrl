@ECHO OFF
ECHO Creating new version
sfdx package:version:create -p 0Ho8d000000GmmCCAS --wait 20 --code-coverage --installation-key-bypass > newVersion.log
ECHO ERRORLEVEL
IF ERRORLEVEL 1 GOTO ERROR




:ERROR
ECHO Uh oh, something bad happened
REM find "Subscriber Package Version Id: " < newVersion.log