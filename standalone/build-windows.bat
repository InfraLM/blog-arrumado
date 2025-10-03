@echo off
echo ========================================
echo  BUILD WINDOWS - Editor de Artigos
echo  Aplicativo Desktop Nativo
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js não está instalado!
    echo Baixe e instale em: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Verificando dependências...
if not exist "node_modules" (
    echo Instalando dependências...
    npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependências
        pause
        exit /b 1
    )
)

echo.
echo Limpando builds anteriores...
if exist "dist" rmdir /s /q dist

echo.
echo Gerando aplicativo Windows...
echo Isso pode demorar alguns minutos...
echo.

npm run build-win

echo.
if exist "dist\EditorArtigos-Portable.exe" (
    echo ========================================
    echo  APLICATIVO WINDOWS GERADO COM SUCESSO!
    echo ========================================
    echo.
    echo 📁 Arquivos gerados em: dist\
    echo.
    echo 🎯 PARA O REDATOR:
    echo ✅ EditorArtigos-Portable.exe (RECOMENDADO)
    echo    - Arquivo único
    echo    - Duplo clique para executar
    echo    - Não precisa instalar nada
    echo.
    echo ✅ win-unpacked\ (ALTERNATIVA)
    echo    - Pasta completa
    echo    - Executar: Editor de Artigos.exe
    echo.
    echo 🎊 CARACTERÍSTICAS:
    echo ✅ Aplicativo desktop nativo
    echo ✅ Não abre navegador
    echo ✅ Janela própria do Windows
    echo ✅ Banco SQLite local
    echo ✅ Diálogos nativos (salvar/abrir)
    echo ✅ Funciona offline
    echo ✅ Interface idêntica
    echo.
    echo 📋 TESTE AGORA:
    echo 1. Vá para: dist\
    echo 2. Execute: EditorArtigos-Portable.exe
    echo 3. Deve abrir janela do aplicativo
    echo.
) else (
    echo ========================================
    echo  ERRO NO BUILD
    echo ========================================
    echo.
    echo Verifique:
    echo 1. Conexão com internet
    echo 2. Espaço em disco
    echo 3. Antivírus não está bloqueando
    echo 4. Permissões de escrita
    echo.
    echo Tente:
    echo 1. Executar como administrador
    echo 2. Desabilitar antivírus temporariamente
    echo 3. Limpar cache: npm cache clean --force
    echo.
)

pause
