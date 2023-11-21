# Salesforce DX Project: Next Steps

Now that you’ve created a Salesforce DX project, what’s next? Here are some documentation resources to get you started.

## How Do You Plan to Deploy Your Changes?

Do you want to deploy a set of changes, or create a self-contained application? Choose a [development model](https://developer.salesforce.com/tools/vscode/en/user-guide/development-models).

## Configure Your Salesforce DX Project

The `sfdx-project.json` file contains useful configuration information for your project. See [Salesforce DX Project Configuration](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_ws_config.htm) in the _Salesforce DX Developer Guide_ for details about this file.

## Read All About It

- [Salesforce Extensions Documentation](https://developer.salesforce.com/tools/vscode/)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_intro.htm)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_intro.htm)
- [Salesforce CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)


https://login.salesforce.com/packaging/installPackage.apexp?p0=04t8d000000lEWPAA2 - version 1.0.0
/packaging/installPackage.apexp?p0=04t8d000000lou7AAA


How to create a package version
sfdx force:package:version:create -p 0Ho8d000000GmmCCAS --wait 10 --codecoverage --installationkeybypass // where 0Ho8d000000GmmCCAS - package Id

make a release package version
sfdx force:package:version:promote -p [04t8d000000lEWPAA2] - package version Id


for create a new minor version with a new components, or if need delete components. In this case need update a "versionNumber" inside sfdx-project.json
sfdx force:package:version:create -p 0Ho8d000000GmmCCAS --wait 10 --codecoverage --installationkeybypass --skipancestorcheck

[IMPORTANT]

If we need to delete something from the package we MUST create a minor version at least and not a PATCH version. It means that need increase number in the middle X.[Y].X
Also we need provide a flag --skipancestorcheck during creating a package


Thos parameter in config we need to use for automatic link last version to current package creation "ancestorVersion": "HIGHEST"




[Additional Info]
Static Code Analisys
https://developer.salesforce.com/blogs/2022/10/develop-even-more-secure-code-with-salesforce-code-analyzer

Example of execution
sfdx scanner:run:dfa --target "./**/*.cls" --projectdir "./" >SCA.log



https://login.salesforce.com/packaging/installPackage.apexp?p0=04t8d000000hecNAAQ



[Dymmy Json]
https://dummyjson.com/
https://dummyjson.com/products

https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_dev2gp_release_note_urls.htm