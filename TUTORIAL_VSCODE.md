# 📋 Tutorial Completo - VSCode e Compilação

## 🎯 Pré-requisitos

### **1. Node.js (Versão Recomendada: 18.x ou 20.x)**

**Download:** https://nodejs.org/

**Verificar instalação:**
```cmd
node --version
npm --version
```

**Deve retornar algo como:**
```
v18.17.0
9.6.7
```

### **2. VSCode**
**Download:** https://code.visualstudio.com/

### **3. Git (Opcional)**
**Download:** https://git-scm.com/

---

## 📥 Importando para o VSCode

### **Método 1: Clone via Git**

1. **Abra o Terminal/CMD**
2. **Navegue para onde quer salvar:**
   ```cmd
   cd C:\dev
   ```
3. **Clone o repositório:**
   ```cmd
   git clone https://github.com/InfraLM/blog-arrumado.git
   ```
4. **Abra no VSCode:**
   ```cmd
   cd blog-arrumado
   code .
   ```

### **Método 2: Download ZIP**

1. **Acesse:** https://github.com/InfraLM/blog-arrumado
2. **Clique:** "Code" → "Download ZIP"
3. **Extraia** para uma pasta (ex: `C:\dev\blog-arrumado`)
4. **Abra VSCode**
5. **File** → **Open Folder** → Selecione a pasta extraída

### **Método 3: Clone pelo VSCode**

1. **Abra VSCode**
2. **Ctrl+Shift+P** → Digite "Git: Clone"
3. **Cole a URL:** `https://github.com/InfraLM/blog-arrumado.git`
4. **Escolha a pasta** onde salvar
5. **Abra o projeto**

---

## 🔧 Configuração Inicial

### **1. Abrir Terminal Integrado**
- **VSCode:** `Ctrl+`` (Ctrl + crase)
- **Ou:** View → Terminal

### **2. Verificar Node.js**
```cmd
node --version
npm --version
```

### **3. Instalar Dependências**
```cmd
npm install
```

**Deve aparecer:**
```
added 45 packages, and audited 46 packages in 3s
found 0 vulnerabilities
```

---

## 🚀 Comandos de Desenvolvimento

### **1. Executar Aplicação (Desenvolvimento)**
```cmd
npm start
```

**Resultado esperado:**
```
========================================
 EDITOR DE ARTIGOS - BLOG LIBERDADE MÉDICA
 Versão Arrumada - Backend + Frontend
========================================

🚀 Servidor iniciado na porta 3000
🌐 Acesse: http://localhost:3000
📊 Status: http://localhost:3000/api/health

💾 Modo: PostgreSQL + Local Fallback
📁 Dados locais: data/artigos.json

Para parar o servidor, pressione Ctrl+C
========================================
```

### **2. Testar no Navegador**
- **Abra:** http://localhost:3000
- **Deve carregar** a interface do editor
- **Status deve mostrar:** ✅ ou ⚠️ dependendo da conexão

### **3. Parar o Servidor**
- **No terminal:** `Ctrl+C`

---

## 📦 Gerar Executável (.exe)

### **Passo 1: Build dos Arquivos**
```cmd
npm run build
```

**Resultado:**
```
========================================
 BUILD - Editor de Artigos
 Blog Liberdade Médica
========================================

✅ Diretório dist limpo
✅ Diretório dist criado
✅ Copiado: server.js
✅ Copiado: index.html
✅ Copiado: styles.css
✅ Copiado: app.js
✅ Copiado: package.json
✅ Diretório data criado
✅ README.md criado

========================================
 BUILD CONCLUÍDO COM SUCESSO!
========================================
```

### **Passo 2: Gerar Executável**
```cmd
npm run build-exe
```

**Processo (pode demorar 2-5 minutos):**
```
========================================
 BUILD EXECUTÁVEL - Editor de Artigos
 Blog Liberdade Médica
========================================

✅ PKG encontrado
📁 Diretório atual: C:\dev\blog-arrumado\dist
📦 Instalando dependências...
✅ Dependências instaladas
✅ Configuração PKG adicionada

🔨 Gerando executáveis...
Isso pode demorar alguns minutos...

📦 Gerando executável para Windows...
✅ Windows: EditorArtigos-Windows.exe

📦 Gerando executável para Linux...
✅ Linux: EditorArtigos-Linux

📦 Gerando executável para macOS...
✅ macOS: EditorArtigos-macOS

========================================
 EXECUTÁVEIS GERADOS COM SUCESSO!
========================================

✅ EditorArtigos-Windows.exe (45.2 MB)
✅ EditorArtigos-Linux (47.1 MB)
✅ EditorArtigos-macOS (46.8 MB)
```

---

## 📁 Estrutura de Arquivos Gerados

```
blog-arrumado/
├── EditorArtigos-Windows.exe    ← ARQUIVO PARA O REDATOR
├── EditorArtigos-Linux
├── EditorArtigos-macOS
├── dist/                        ← Arquivos de build
│   ├── server.js
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── package.json
├── backend/                     ← Código fonte
├── frontend/
└── scripts/
```

---

## 🎯 Distribuição para o Redator

### **Arquivo para Enviar:**
- **Windows:** `EditorArtigos-Windows.exe` (45-50 MB)

### **Instruções para o Redator:**

1. **Baixar** o arquivo `EditorArtigos-Windows.exe`
2. **Salvar** em uma pasta (ex: Desktop)
3. **Executar** (duplo clique)
4. **Aguardar** servidor iniciar (10-15 segundos)
5. **Navegador abre** automaticamente
6. **Usar** a interface normalmente

### **Como Funciona:**
- Executável inicia servidor local na porta 3000
- Abre navegador em http://localhost:3000
- Interface idêntica à versão web
- Artigos salvos em `data/artigos.json`
- Conecta ao PostgreSQL quando disponível

---

## 🔍 Solução de Problemas

### **Erro: "node não é reconhecido"**
**Solução:** Instalar Node.js do site oficial

### **Erro: "npm install falhou"**
**Soluções:**
```cmd
# Limpar cache
npm cache clean --force

# Tentar novamente
npm install

# Ou usar yarn
npm install -g yarn
yarn install
```

### **Erro: "PKG não encontrado"**
**Solução:**
```cmd
npm install -g pkg
```

### **Erro: "Porta 3000 em uso"**
**Soluções:**
```cmd
# Matar processos Node.js
taskkill /f /im node.exe

# Ou mudar porta no código
# backend/server.js linha 8: const PORT = 3001;
```

### **Executável não abre**
**Verificações:**
1. Antivírus pode estar bloqueando
2. Windows Defender SmartScreen
3. Executar como administrador
4. Verificar se porta 3000 está livre

---

## 📊 Comandos de Manutenção

### **Limpar Build**
```cmd
rmdir /s /q dist
rmdir /s /q node_modules
npm install
```

### **Atualizar Dependências**
```cmd
npm update
```

### **Verificar Vulnerabilidades**
```cmd
npm audit
npm audit fix
```

### **Testar Conexão PostgreSQL**
```cmd
npm test
```

---

## 🎊 Resumo dos Comandos

### **Setup Inicial:**
```cmd
git clone https://github.com/InfraLM/blog-arrumado.git
cd blog-arrumado
npm install
```

### **Desenvolvimento:**
```cmd
npm start                 # Executar aplicação
# Ctrl+C para parar
```

### **Gerar Executável:**
```cmd
npm run build            # Preparar arquivos
npm run build-exe        # Gerar .exe
```

### **Resultado:**
- `EditorArtigos-Windows.exe` → Enviar para o redator
- Interface completa funcionando
- Conexão PostgreSQL + fallback local
- Pronto para uso profissional

---

**🎯 Agora você tem um sistema completo e confiável para o redator criar artigos!**
