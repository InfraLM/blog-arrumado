# 🔨 Como Compilar o Aplicativo para .EXE
## Editor de Artigos - Blog Liberdade Médica

### 📋 Pré-requisitos

**Obrigatório:**
- ✅ **Node.js 18+** instalado
- ✅ **npm** funcionando
- ✅ **Git** (para fazer o pull do projeto)

**Para Windows:**
- ✅ **Windows 10/11** (recomendado compilar no próprio Windows)
- ✅ **PowerShell** ou **Prompt de Comando**

### 📥 1. Baixar o Projeto

```bash
# Se ainda não tem o projeto
git clone https://github.com/InfraLM/blog-arrumado.git

# Se já tem, apenas atualize
cd blog-arrumado
git pull origin main
```

### 📂 2. Navegar para a Pasta Correta

```bash
cd blog-arrumado/standalone
```

### 📦 3. Instalar Dependências

```bash
npm install
```

**⚠️ Importante:** Aguarde a instalação completa. Pode demorar alguns minutos.

### 🧪 4. Testar Antes de Compilar (Opcional mas Recomendado)

```bash
# Testar conexão PostgreSQL
node test-db.js

# Testar servidor integrado
node test-server.js

# Testar aplicativo (se tiver interface gráfica)
npm start
```

### 🔨 5. Compilar para Windows

#### **Opção A: Script Automático (Recomendado)**

```bash
# No Windows
build-windows-final.bat

# No Linux/Mac (cross-compilation)
npm run build-win
```

#### **Opção B: Comandos Manuais**

```bash
# Instalar electron-builder globalmente (se necessário)
npm install -g electron-builder

# Compilar apenas para Windows
npm run build-win

# Ou compilar para todas as plataformas
npm run build-all
```

#### **Opção C: Comando Direto**

```bash
npx electron-builder --win
```

### 📁 6. Localizar o Arquivo .EXE

Após a compilação, os arquivos estarão em:

```
standalone/
└── dist/
    ├── win-unpacked/           # Pasta com aplicativo descompactado
    │   └── Editor de Artigos.exe  # ← ARQUIVO EXECUTÁVEL
    ├── *.exe                   # Instalador (se configurado)
    └── *.zip                   # Arquivo compactado
```

### 🚀 7. Tipos de Build Disponíveis

#### **Portable (Recomendado)**
- **Arquivo:** `EditorArtigos-Servidor.exe`
- **Vantagem:** Não precisa instalar, só executar
- **Localização:** `dist/`

#### **Descompactado**
- **Pasta:** `dist/win-unpacked/`
- **Arquivo:** `Editor de Artigos.exe`
- **Vantagem:** Mais rápido para testar

#### **Instalador**
- **Arquivo:** `Editor de Artigos Setup.exe`
- **Vantagem:** Instalação tradicional no Windows

### 🔧 Configurações de Build

O arquivo `package.json` já está configurado com:

```json
{
  "build": {
    "appId": "com.liberdademedica.editor-artigos-servidor",
    "productName": "Editor de Artigos - Blog Liberdade Médica",
    "win": {
      "target": [
        {
          "target": "portable",
          "arch": ["x64"]
        },
        {
          "target": "zip", 
          "arch": ["x64"]
        }
      ]
    },
    "portable": {
      "artifactName": "EditorArtigos-Servidor.exe"
    }
  }
}
```

### 🐛 Solução de Problemas

#### ❌ **"Erro: Cannot find module 'electron'"**
```bash
npm install electron --save-dev
```

#### ❌ **"wine is required"** (no Linux)
- **Solução:** Compile no Windows ou instale Wine
- **Alternativa:** Use GitHub Actions (CI/CD)

#### ❌ **"Permission denied"**
```bash
# No Windows (como Administrador)
npm run build-win

# No Linux/Mac
sudo npm run build-win
```

#### ❌ **"Out of memory"**
- **Feche** outros programas
- **Libere** espaço em disco (mínimo 2GB)
- **Aumente** a memória virtual do Windows

#### ❌ **"Antivirus blocking"**
- **Adicione** exceção no antivírus para a pasta do projeto
- **Desative** temporariamente o antivírus durante o build

### 📊 Tamanhos Esperados

- **Projeto fonte:** ~100MB
- **node_modules:** ~400MB  
- **Build final:** ~100-150MB
- **Executável portable:** ~100MB

### 🔄 Build Automatizado (GitHub Actions)

Se quiser automatizar, crie `.github/workflows/build.yml`:

```yaml
name: Build Electron App
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: windows-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 18
    - run: cd standalone && npm install
    - run: cd standalone && npm run build-win
    - uses: actions/upload-artifact@v3
      with:
        name: windows-build
        path: standalone/dist/
```

### 🎯 Comandos Resumidos

```bash
# 1. Baixar projeto
git pull origin main

# 2. Entrar na pasta
cd standalone

# 3. Instalar dependências  
npm install

# 4. Compilar
npm run build-win

# 5. Executar
./dist/win-unpacked/Editor\ de\ Artigos.exe
```

### 📋 Checklist Final

Antes de distribuir o .exe:

- [ ] ✅ Aplicativo abre sem erros
- [ ] ✅ Conecta com PostgreSQL
- [ ] ✅ Consegue criar artigos
- [ ] ✅ Interface funciona corretamente
- [ ] ✅ Não há dependências externas
- [ ] ✅ Testado em máquina limpa

### 🚀 Distribuição

Para distribuir o aplicativo:

1. **Copie** o arquivo `EditorArtigos-Servidor.exe`
2. **Teste** em outra máquina Windows
3. **Crie** um ZIP com:
   - O executável
   - `INSTALACAO-WINDOWS.md`
   - `README-FINAL.md`

### 💡 Dicas Importantes

- **Compile no Windows** para melhor compatibilidade
- **Teste sempre** antes de distribuir
- **Mantenha** o Node.js atualizado
- **Use** o modo portable para facilitar distribuição
- **Documente** os requisitos do sistema

---

**🎉 Pronto! Agora você tem um .exe funcional do seu aplicativo!**

*Para dúvidas, consulte os logs de build ou entre em contato com o suporte.*
