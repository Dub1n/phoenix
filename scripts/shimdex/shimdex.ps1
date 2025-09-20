[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$modulePath = Join-Path (Split-Path -Parent $PSCommandPath) 'Shimdex.psm1'
if (-not (Test-Path $modulePath)) {
    throw "Unable to locate Shimdex module at $modulePath."
}

Import-Module $modulePath -Force

Invoke-ShimdexMenu
