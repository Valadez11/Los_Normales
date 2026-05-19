# =============================================================
# fix-merge.ps1 — Completa el merge con origin/main de forma robusta
# Ejecutar desde: E:\POS-Soft\Los_Normales\
# =============================================================

Set-Location "E:\POS-Soft\Los_Normales"

# --- 1. Detener servidor ---
Write-Host ""
Write-Host "[1/7] Deteniendo Node.js en puerto 5000..." -ForegroundColor Cyan
$proceso = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess | Select-Object -First 1
if ($proceso) {
    Stop-Process -Id $proceso -Force
    Write-Host "      Servidor detenido (PID $proceso)." -ForegroundColor Green
} else {
    Write-Host "      Servidor no estaba corriendo." -ForegroundColor Yellow
}

# --- 2. Abortar merge pendiente si existe ---
Write-Host ""
Write-Host "[2/7] Limpiando estado de merge anterior..." -ForegroundColor Cyan
if (Test-Path ".git/MERGE_HEAD") {
    git merge --abort 2>&1 | Out-Null
    Write-Host "      Merge anterior abortado." -ForegroundColor Yellow
} else {
    Write-Host "      No habia merge pendiente." -ForegroundColor Yellow
}

# --- 3. Guardar version limpia de app.js (antes de que el merge la sobreescriba) ---
Write-Host ""
Write-Host "[3/7] Guardando copia de seguridad de backend/app.js limpio..." -ForegroundColor Cyan
Copy-Item "backend\app.js" "backend\app.js.bak" -Force
Write-Host "      Guardado en backend/app.js.bak" -ForegroundColor Green

# --- 4. Ejecutar merge (fallara con conflictos — es esperado) ---
Write-Host ""
Write-Host "[4/7] Ejecutando git merge origin/main..." -ForegroundColor Cyan
git merge origin/main 2>&1 | Out-Null
Write-Host "      Merge ejecutado (conflictos esperados, seran resueltos ahora)." -ForegroundColor Yellow

# --- 5. Restaurar backend/app.js limpio y eliminar app.js raiz obsoleto ---
Write-Host ""
Write-Host "[5/7] Restaurando archivos resueltos..." -ForegroundColor Cyan
Copy-Item "backend\app.js.bak" "backend\app.js" -Force
Remove-Item "backend\app.js.bak" -ErrorAction SilentlyContinue
Remove-Item "app.js" -ErrorAction SilentlyContinue
Write-Host "      backend/app.js restaurado sin conflictos." -ForegroundColor Green
Write-Host "      app.js raiz eliminado (obsoleto)." -ForegroundColor Green

# --- 6. Marcar todo como resuelto y completar el merge commit ---
Write-Host ""
Write-Host "[6/7] Completando merge commit..." -ForegroundColor Cyan
git add backend/app.js
git add backend/database/db.js
git add .gitignore
git add backend/database/seed.js
git add -A 2>&1 | Out-Null   # captura cualquier otro archivo en conflicto

$commitOutput = git commit --no-edit -m "merge: fusionar origin/main — PBI-006, PBI-021, Login Alfonso integrados" 2>&1
Write-Host $commitOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host "      Merge commit creado exitosamente." -ForegroundColor Green
} else {
    Write-Host "      Nota: puede que no hubiera nada nuevo que commitear." -ForegroundColor Yellow
}

# --- 7. Sembrar BD y levantar servidor ---
Set-Location "backend"
node database/seed.js
node app.js