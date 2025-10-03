@echo off
echo ========================================
echo  BUILD CORRIGIDO - Editor de Artigos
echo  Versao Desktop SEM SQLite
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao esta instalado!
    echo Baixe e instale em: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Limpando instalacao anterior...
if exist "node_modules" rmdir /s /q node_modules
if exist "dist" rmdir /s /q dist
if exist "package-lock.json" del package-lock.json

echo.
echo Instalando dependencias (SEM SQLite)...
npm install

if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias
    echo.
    echo Tentando corrigir...
    npm cache clean --force
    npm install
    
    if errorlevel 1 (
        echo ERRO PERSISTENTE: Nao foi possivel instalar dependencias
        echo.
        echo Solucoes:
        echo 1. Verifique conexao com internet
        echo 2. Execute como administrador
        echo 3. Desabilite antivirus temporariamente
        pause
        exit /b 1
    )
)

echo.
echo Gerando aplicativo Windows...
echo Isso pode demorar alguns minutos...
echo.

npm run build-win

echo.
if exist "dist\EditorArtigos-Portable.exe" (
    echo ========================================
    echo  SUCESSO! APLICATIVO GERADO!
    echo ========================================
    echo.
    echo 📁 Arquivos gerados em: dist\
    echo.
    dir dist\ /b
    echo.
    echo 🎯 ARQUIVO PRINCIPAL PARA O REDATOR:
    echo ✅ EditorArtigos-Portable.exe
    echo.
    echo 📋 CARACTERISTICAS:
    echo ✅ Aplicativo desktop nativo
    echo ✅ Nao abre navegador
    echo ✅ Janela propria do Windows
    echo ✅ Dados salvos em JSON local
    echo ✅ Dialogos nativos (salvar/abrir)
    echo ✅ Funciona offline
    echo ✅ Interface identica
    echo ✅ SEM problemas de SQLite
    echo.
    echo 📋 TESTE AGORA:
    echo 1. Va para: dist\
    echo 2. Execute: EditorArtigos-Portable.exe
    echo 3. Deve abrir janela do aplicativo
    echo.
    echo 📤 PARA DISTRIBUIR:
    echo Envie apenas o arquivo: EditorArtigos-Portable.exe
    echo O redator executa com duplo clique!
    echo.
) else (
    echo ========================================
    echo  ERRO NO BUILD
    echo ========================================
    echo.
    echo Verificando o que foi gerado...
    if exist "dist" (
        echo Conteudo da pasta dist:
        dir dist\ /b
    ) else (
        echo Pasta dist nao foi criada
    )
    echo.
    echo Possiveis solucoes:
    echo 1. Executar como administrador
    echo 2. Desabilitar antivirus temporariamente
    echo 3. Verificar espaco em disco
    echo 4. Tentar: npm cache clean --force
    echo.
)

pause
