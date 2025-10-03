# Editor de Artigos - Blog Liberdade Médica

Sistema completo para criação de artigos do blog, com **duas versões**: web e desktop standalone.

## 🎯 Versões Disponíveis

### 🌐 **Versão Web** (Pasta raiz)
- **Para desenvolvedores** que têm Node.js
- Interface web no navegador
- PostgreSQL + fallback local
- Ideal para múltiplos usuários

### 💻 **Versão Desktop Standalone** (Pasta `standalone/`)
- **Para redatores** sem conhecimento técnico
- **NÃO precisa de Node.js**
- Aplicativo desktop nativo
- Janela própria (não abre navegador)
- Banco SQLite local
- **RECOMENDADO PARA O REDATOR**

## 🚀 Para o Redator (Versão Desktop)

### **📥 Como Baixar e Usar:**

1. **Você gera o aplicativo:**
   ```cmd
   cd standalone
   npm install
   npm run build-win
   ```

2. **Envia para o redator:**
   - `dist/EditorArtigos-Portable.exe` (arquivo único)

3. **Redator usa:**
   - Baixa o arquivo
   - Duplo clique para executar
   - Janela do aplicativo abre
   - Interface idêntica à versão web
   - Dados salvos localmente

### **✅ Vantagens para o Redator:**
- ❌ **Não precisa instalar Node.js**
- ❌ **Não precisa configurar nada**
- ✅ **Arquivo único executável**
- ✅ **Aplicativo desktop nativo**
- ✅ **Janela própria (não é navegador)**
- ✅ **Funciona offline**
- ✅ **Diálogos nativos** para salvar/abrir
- ✅ **Interface idêntica**

## 🔧 Para Desenvolvedores (Versão Web)

### **Instalação e Uso:**

```bash
# 1. Clone o repositório
git clone https://github.com/InfraLM/blog-arrumado.git
cd blog-arrumado

# 2. Instale dependências
npm install

# 3. Execute a aplicação
npm start

# 4. Acesse no navegador
http://localhost:3000
```

### **Gerar Executável:**

```bash
# 1. Gere os arquivos de distribuição
npm run build

# 2. Gere os executáveis
npm run build-exe
```

## 📊 Comparação das Versões

| Aspecto | Versão Web | Versão Desktop |
|---------|------------|----------------|
| **Público** | Desenvolvedores | Redatores |
| **Instalação** | Precisa Node.js | ❌ Não precisa nada |
| **Interface** | Navegador | ✅ Janela nativa |
| **Dados** | PostgreSQL/JSON | ✅ SQLite local |
| **Distribuição** | Complexa | ✅ Arquivo único |
| **Offline** | Limitado | ✅ Completo |
| **Simplicidade** | Média | ✅ Máxima |

## 🎯 Qual Versão Usar?

### **🌐 Use a Versão Web quando:**
- Você é desenvolvedor
- Tem Node.js instalado
- Quer conectar ao PostgreSQL
- Precisa de múltiplos usuários
- Tem infraestrutura de servidor

### **💻 Use a Versão Desktop quando:**
- Redator não tem conhecimento técnico
- Quer máxima simplicidade
- Prefere aplicativo nativo
- Não quer depender de servidor
- Quer dados locais seguros

## 📁 Estrutura do Projeto

```
blog-arrumado/
├── backend/              # Servidor Express (versão web)
├── frontend/             # Interface HTML/CSS/JS (versão web)
├── standalone/           # Aplicativo desktop (versão standalone)
│   ├── main.js          # Processo principal Electron
│   ├── app.js           # Lógica desktop
│   ├── build.js         # Script de build
│   └── build-windows.bat # Build para Windows
├── scripts/              # Scripts de build (versão web)
├── dist/                 # Arquivos de distribuição
└── TUTORIAL_VSCODE.md    # Tutorial detalhado
```

## 🎊 Funcionalidades (Ambas as Versões)

### ✅ **Criação de Artigos**
- Blocos modulares (H1-H6, Parágrafo)
- Pré-visualização em tempo real
- Reordenação de blocos (mover para cima/baixo)
- Geração automática de slug
- 16 categorias médicas especializadas

### ✅ **Gerenciamento**
- Salvamento/carregamento de rascunhos
- Exportação de HTML completo
- Lista de artigos publicados
- Interface responsiva (desktop/tablet/mobile)
- Validação completa de formulários

### ✅ **Dados**
- **Versão Web**: PostgreSQL + fallback JSON
- **Versão Desktop**: SQLite local
- Estrutura compatível entre versões
- Migração possível entre sistemas

## 🚀 Comandos Principais

### **Versão Web:**
```bash
npm install          # Instalar dependências
npm start            # Executar aplicação
npm run build        # Preparar distribuição
npm run build-exe    # Gerar executáveis
```

### **Versão Desktop:**
```bash
cd standalone
npm install          # Instalar dependências
npm start            # Testar aplicação
npm run build-win    # Gerar para Windows
node build.js        # Gerar para todas as plataformas
```

## 📋 Requisitos

### **Para Desenvolvimento (Versão Web):**
- Node.js 18+
- NPM ou Yarn
- PostgreSQL (opcional)

### **Para o Redator (Versão Desktop):**
- ❌ **Nenhum requisito!**
- Arquivo executável único
- Funciona em qualquer Windows/Mac/Linux

## 🎯 Recomendação Final

### **Para Você (Desenvolvedor):**
1. **Use a versão web** para desenvolvimento e testes
2. **Gere a versão desktop** para o redator
3. **Distribua o arquivo único** EditorArtigos-Portable.exe
4. **Redator usa sem complicações**

### **Para o Redator:**
1. **Baixa** o arquivo executável
2. **Executa** com duplo clique
3. **Usa** a interface familiar
4. **Cria artigos** profissionalmente

---

## 🎊 Resultado Final

**✅ DUAS VERSÕES COMPLETAS:**

1. **🌐 Versão Web** - Para desenvolvedores com Node.js
2. **💻 Versão Desktop** - Para redatores sem conhecimento técnico

**✅ MESMO SISTEMA, DUAS FORMAS DE USO:**

- **Funcionalidades idênticas**
- **Interface igual**
- **Dados compatíveis**
- **Escolha baseada no usuário**

**🎯 Agora você tem a solução perfeita para qualquer cenário!**

*Criado para o Blog Liberdade Médica - Sistema profissional de criação de artigos*
