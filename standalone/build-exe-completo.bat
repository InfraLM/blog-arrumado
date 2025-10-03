@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   COMPILADOR DE APLICATIVO ELECTRON
echo   Editor de Artigos - Blog Liberdade Medica
echo ========================================
echo.

REM Verificar se estamos na pasta correta
if not exist "package.json" (
    echo ❌ Erro: package.json nao encontrado
    echo    Certifique-se de estar na pasta 'standalone'
    echo.
    pause
    exit /b 1
)

echo ✅ Pasta correta detectada
echo.

REM Verificar Node.js
echo 🔄 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado
    echo    Baixe em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js encontrado: !NODE_VERSION!

REM Verificar npm
echo 🔄 Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm nao encontrado
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm encontrado: !NPM_VERSION!
echo.

REM Limpar builds anteriores
echo 🧹 Limpando builds anteriores...
if exist "dist" (
    rmdir /s /q "dist" 2>nul
    echo ✅ Pasta dist removida
) else (
    echo ℹ️ Nenhum build anterior encontrado
)
echo.

REM Instalar/Atualizar dependências
echo 📦 Instalando dependencias...
echo    Isso pode demorar alguns minutos...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias
    echo    Tente executar como Administrador
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas com sucesso
echo.

REM Testar conexão PostgreSQL (opcional)
echo 🔍 Testando conexao PostgreSQL...
if exist "test-db.js" (
    timeout /t 3 /nobreak >nul
    node test-db.js
    if %errorlevel% equ 0 (
        echo ✅ PostgreSQL: Conexao OK
    ) else (
        echo ⚠️ PostgreSQL: Erro na conexao
        echo    O aplicativo funcionara em modo offline
    )
) else (
    echo ℹ️ Arquivo de teste nao encontrado
)
echo.

REM Verificar espaço em disco
echo 💾 Verificando espaco em disco...
for /f "tokens=3" %%i in ('dir /-c ^| find "bytes free"') do set FREE_SPACE=%%i
if !FREE_SPACE! LSS 2000000000 (
    echo ⚠️ Aviso: Pouco espaco em disco (menos de 2GB livre)
    echo    O build pode falhar
    echo.
)

REM Compilar aplicativo
echo 🔨 Compilando aplicativo...
echo    Gerando executavel para Windows...
echo    Aguarde, isso pode demorar varios minutos...
echo.

call npm run build-win
set BUILD_RESULT=%errorlevel%

echo.
if %BUILD_RESULT% equ 0 (
    echo ✅ COMPILACAO CONCLUIDA COM SUCESSO!
    echo.
    
    REM Verificar arquivos gerados
    if exist "dist" (
        echo 📁 Arquivos gerados:
        echo.
        dir /b "dist\*.exe" 2>nul
        dir /b "dist\*.zip" 2>nul
        
        if exist "dist\win-unpacked" (
            echo    📂 dist\win-unpacked\Editor de Artigos.exe
        )
        
        echo.
        echo 🎯 COMO USAR:
        echo    1. Va para a pasta 'dist\'
        echo    2. Execute o arquivo .exe
        echo    3. Ou extraia o arquivo .zip
        echo.
        
        REM Calcular tamanho dos arquivos
        echo 📊 Tamanhos dos arquivos:
        for %%f in ("dist\*.exe") do (
            echo    %%~nxf: %%~zf bytes
        )
        for %%f in ("dist\*.zip") do (
            echo    %%~nxf: %%~zf bytes
        )
        echo.
        
    ) else (
        echo ⚠️ Pasta dist nao encontrada
    )
    
) else (
    echo ❌ ERRO NA COMPILACAO
    echo.
    echo 🔍 Possiveis causas:
    echo    - Falta de memoria RAM
    echo    - Pouco espaco em disco
    echo    - Antivirus bloqueando
    echo    - Dependencias corrompidas
    echo.
    echo 💡 Solucoes:
    echo    1. Execute como Administrador
    echo    2. Desative temporariamente o antivirus
    echo    3. Libere espaco em disco
    echo    4. Tente: npm cache clean --force
    echo.
)

echo ========================================
echo   PROCESSO FINALIZADO
echo ========================================
echo.

REM Perguntar se quer abrir a pasta dist
if exist "dist" (
    set /p OPEN_FOLDER="Deseja abrir a pasta dist? (s/n): "
    if /i "!OPEN_FOLDER!"=="s" (
        explorer "dist"
    )
)

echo.
echo Pressione qualquer tecla para sair...
pause >nul
