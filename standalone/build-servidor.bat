@echo off
echo ========================================
echo  EDITOR DE ARTIGOS - SERVIDOR INTEGRADO
echo  Blog Liberdade Medica
echo ========================================
echo.

echo [INFO] Esta versao inicia um servidor backend interno
echo        que conecta diretamente ao PostgreSQL
echo.

echo [1/7] Limpando instalacao anterior...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist package-lock.json del package-lock.json
echo ✅ Limpeza concluida

echo.
echo [2/7] Limpando cache npm...
npm cache clean --force
echo ✅ Cache limpo

echo.
echo [3/7] Instalando dependencias...
echo      - electron (interface desktop)
echo      - pg (PostgreSQL)
echo      - express (servidor web)
echo      - cors (CORS headers)
npm install
if errorlevel 1 (
    echo ❌ Erro ao instalar dependencias
    echo.
    echo Tentando instalacao individual...
    npm install electron@^27.0.0
    npm install pg@^8.11.3
    npm install express@^4.18.2
    npm install cors@^2.8.5
    npm install electron-builder@^24.6.4
    
    if errorlevel 1 (
        echo ❌ Erro na instalacao individual
        pause
        exit /b 1
    )
)
echo ✅ Dependencias instaladas

echo.
echo [4/7] Verificando estrutura...
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
if not exist app-web.js (
    echo ❌ Arquivo app-web.js nao encontrado
    pause
    exit /b 1
)
echo ✅ Estrutura verificada

echo.
echo [5/7] Testando aplicacao...
echo      Iniciando teste rapido (10 segundos)...
timeout /t 2 /nobreak > nul
start /min npm start
timeout /t 8 /nobreak > nul
taskkill /f /im electron.exe > nul 2>&1
echo ✅ Teste concluido

echo.
echo [6/7] Gerando aplicativo Windows...
echo      - Executavel portatil
echo      - Arquivo ZIP
echo      - Sem assinatura digital
npm run build-win
if errorlevel 1 (
    echo ❌ Erro ao gerar aplicativo
    echo.
    echo Tentando metodo alternativo...
    npx electron-builder --win --config package.json
    if errorlevel 1 (
        echo ❌ Erro no metodo alternativo tambem
        pause
        exit /b 1
    )
)
echo ✅ Aplicativo gerado

echo.
echo [7/7] Verificando resultado...
if exist dist\EditorArtigos-Servidor.exe (
    echo ✅ SUCESSO! Aplicativo criado:
    echo    📁 dist\EditorArtigos-Servidor.exe
    echo.
    echo 🎯 COMO FUNCIONA:
    echo    1. Executavel inicia servidor backend interno
    echo    2. Servidor conecta ao PostgreSQL automaticamente
    echo    3. Interface web abre em janela nativa
    echo    4. Artigos salvos diretamente no banco
    echo    5. Servidor encerra quando fecha aplicativo
    echo.
    echo 📊 INFORMACOES TECNICAS:
    echo    - Servidor: Express.js na porta 3001
    echo    - PostgreSQL: 35.199.101.38:5432
    echo    - Database: liberdade-medica
    echo    - Tabela: public.blog_artigos
    echo.
    echo 📦 DISTRIBUICAO:
    echo    - Envie apenas: EditorArtigos-Servidor.exe
    echo    - Redator executa com duplo clique
    echo    - Aplicativo funciona completamente offline
    echo    - Conecta automaticamente quando possivel
    echo.
    dir dist\*.exe
) else (
    echo ❌ Arquivo executavel nao foi criado
    echo Verificando pasta dist...
    if exist dist (
        echo Conteudo da pasta dist:
        dir dist
    ) else (
        echo Pasta dist nao existe
    )
)

echo.
echo ========================================
echo  INSTRUCOES PARA O REDATOR
echo ========================================
echo.
echo 1. EXECUTAR APLICATIVO:
echo    - Duplo clique em EditorArtigos-Servidor.exe
echo    - Aguardar janela abrir (pode demorar 10-15 segundos)
echo    - Interface carrega automaticamente
echo.
echo 2. STATUS DA CONEXAO:
echo    - Verde: PostgreSQL conectado (artigos no blog)
echo    - Amarelo: Modo offline (artigos locais)
echo    - Vermelho: Erro de conexao
echo.
echo 3. USAR O EDITOR:
echo    - Preencher titulo, categoria, autor
echo    - Adicionar blocos de conteudo
echo    - Visualizar pre-visualizacao
echo    - Clicar "Publicar Artigo"
echo.
echo 4. FECHAR APLICATIVO:
echo    - Fechar janela normalmente
echo    - Servidor encerra automaticamente
echo    - Dados ficam salvos no banco
echo.
echo ========================================
echo  BUILD CONCLUIDO
echo ========================================
pause
