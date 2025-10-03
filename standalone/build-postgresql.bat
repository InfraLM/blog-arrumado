@echo off
echo ========================================
echo  EDITOR DE ARTIGOS - BUILD POSTGRESQL
echo  Blog Liberdade Medica
echo ========================================
echo.

echo [1/6] Limpando instalacao anterior...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist package-lock.json del package-lock.json
echo ✅ Limpeza concluida

echo.
echo [2/6] Limpando cache npm...
npm cache clean --force
echo ✅ Cache limpo

echo.
echo [3/6] Instalando dependencias...
npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependencias
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas

echo.
echo [4/6] Verificando estrutura...
if not exist main.js (
    echo ❌ Arquivo main.js nao encontrado
    pause
    exit /b 1
)
if not exist index.html (
    echo ❌ Arquivo index.html nao encontrado
    pause
    exit /b 1
)
echo ✅ Estrutura verificada

echo.
echo [5/6] Gerando aplicativo Windows...
npm run build-win
if errorlevel 1 (
    echo ❌ Erro ao gerar aplicativo
    echo.
    echo Tentando metodo alternativo...
    npx electron-builder --win --config electron-builder.json
    if errorlevel 1 (
        echo ❌ Erro no metodo alternativo tambem
        pause
        exit /b 1
    )
)
echo ✅ Aplicativo gerado

echo.
echo [6/6] Verificando resultado...
if exist dist\EditorArtigos-Portable.exe (
    echo ✅ SUCESSO! Aplicativo criado:
    echo    📁 dist\EditorArtigos-Portable.exe
    echo.
    echo 🎯 INSTRUCOES PARA DISTRIBUICAO:
    echo    1. Envie o arquivo EditorArtigos-Portable.exe
    echo    2. Redator executa com duplo clique
    echo    3. Aplicativo conecta automaticamente ao PostgreSQL
    echo    4. Se PostgreSQL falhar, usa modo offline
    echo.
    dir dist\*.exe
) else (
    echo ❌ Arquivo executavel nao foi criado
    echo Verificando pasta dist...
    if exist dist dir dist
)

echo.
echo ========================================
echo  BUILD CONCLUIDO
echo ========================================
pause
