$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$moduleRoot = Split-Path -Parent $here
$modulePath = Join-Path $moduleRoot 'Shimdex.psm1'

Describe 'Shimdex module' {
    BeforeAll {
        $script:originalAppData = $env:APPDATA
        $script:testAppData = Join-Path $TestDrive 'AppData'
        New-Item -ItemType Directory -Path $script:testAppData -Force | Out-Null
        $env:APPDATA = $script:testAppData
        Import-Module $modulePath -Force
    }

    AfterAll {
        Remove-Module Shimdex -Force -ErrorAction SilentlyContinue
        $env:APPDATA = $script:originalAppData
    }

    It 'returns default config when none exists' {
        $paths = Get-ShimdexPaths
        if (Test-Path $paths.ConfigPath) { Remove-Item $paths.ConfigPath -Force }
        $config = Get-ShimdexConfig
        $config.Mode | Should Be 'Auto'
        $config.WorkspaceRoots.Count | Should Be 0
        $config.AutoManagePath | Should Be $true
    }

    It 'updates environment when mode is set without persisting' {
        Set-ShimdexMode -Mode 'Force' -Persist:$false | Out-Null
        [Environment]::GetEnvironmentVariable('SHIMDEX_MODE') | Should Be 'Force'
        Set-ShimdexMode -Mode 'Auto' -Persist:$false | Out-Null
    }

    It 'produces status object' {
        $status = Get-ShimdexStatus
        ($status -is [pscustomobject]) | Should Be $true
        $status.ConfigMode | Should Be 'Auto'
        ($status.UserPathIncludesShim -is [bool]) | Should Be $true
    }
}


