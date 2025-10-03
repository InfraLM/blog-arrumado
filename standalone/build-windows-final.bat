@echo off
echo ========================================
echo  CONSTRUINDO APLICATIVO PARA WINDOWS
echo  Editor de Artigos - Blog Liberdade Medica
echo ========================================
echo.

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js nao encontrado. Instale o Node.js primeiro.
    echo    Download: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Verificar se npm está disponível
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm nao encontrado
    pause
    exit /b 1
)

echo ✅ npm encontrado
echo.

REM Instalar dependências
echo 🔄 Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas
echo.

REM Testar conexão com PostgreSQL
echo 🔄 Testando conexao com PostgreSQL...
node test-db.js
if %errorlevel% neq 0 (
    echo ⚠️ Aviso: Erro na conexao PostgreSQL
    echo    O aplicativo ainda funcionara, mas sem conexao com o banco
    echo.
)

REM Construir aplicativo
echo 🔄 Construindo aplicativo...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erro ao construir aplicativo
    pause
    exit /b 1
)

echo.
echo ✅ Aplicativo construido com sucesso!
echo.
echo 📁 Arquivos gerados em: dist/
echo.
echo 🚀 Para executar o aplicativo:
echo    - Extraia o arquivo ZIP da pasta dist/
echo    - Execute o arquivo .exe
echo.
pause
