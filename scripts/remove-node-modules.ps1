<#
PowerShell script para eliminar `node_modules` en las carpetas:
- frontend
- backend
- execution-engine

Uso: ejecutar desde la raíz del repo (donde están las carpetas) con PowerShell (administrador no necesario normalmente):
    .\scripts\remove-node-modules.ps1

El script usa el truco de `robocopy` con una carpeta vacía para evitar problemas con rutas largas y permisos.
#>

$Targets = @('frontend','backend','execution-engine')
$RepoRoot = (Resolve-Path .).Path
$EmptyDir = Join-Path -Path $env:TEMP -ChildPath "empty_dir_for_deletion_repo"

# Crear carpeta vacía temporal
if (-not (Test-Path $EmptyDir)) {
    New-Item -ItemType Directory -Path $EmptyDir | Out-Null
}

foreach ($t in $Targets) {
    $nm = Join-Path -Path $RepoRoot -ChildPath (Join-Path $t 'node_modules')
    if (Test-Path $nm) {
        Write-Host "Eliminando: $nm" -ForegroundColor Yellow
        try {
            # Robocopy mirroring from empty dir to target to remove contents reliably (maneja long paths)
            $robocopyArgs = @('"' + $EmptyDir + '"','"' + $nm + '"','/MIR','/NJH','/NJS','/NP')
            $rc = Start-Process -FilePath robocopy -ArgumentList $robocopyArgs -NoNewWindow -Wait -PassThru
            # Robocopy returns codes where 0 and 1 are OK, anything >1 may be warnings/errors
            if ($rc.ExitCode -le 1) {
                # Ahora eliminar la carpeta residual
                Remove-Item -LiteralPath $nm -Recurse -Force -ErrorAction Stop
                Write-Host "Eliminado: $nm" -ForegroundColor Green
            } else {
                Write-Warning "robocopy devolvió código $($rc.ExitCode) al limpiar $nm. Intentando Remove-Item directamente."
                Remove-Item -LiteralPath $nm -Recurse -Force -ErrorAction Stop
                Write-Host "Eliminado (por Remove-Item): $nm" -ForegroundColor Green
            }
        } catch {
            Write-Warning "Error eliminando ${nm}: $($_.Exception.Message)"
        }
    } else {
        Write-Host "No existe: $nm" -ForegroundColor DarkGray
    }
}

# Limpiar carpeta temporal
try { Remove-Item -LiteralPath $EmptyDir -Recurse -Force -ErrorAction SilentlyContinue } catch {}

Write-Host "Operación completada." -ForegroundColor Cyan
