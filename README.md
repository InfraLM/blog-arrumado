# Editor de Artigos - Blog Liberdade Médica

Sistema completo para criação de artigos do blog, com interface moderna e conexão direta ao PostgreSQL.

## 🎯 Características

### ✅ **Arquitetura Simples e Robusta**
- **Backend**: Node.js + Express (sem frameworks complexos)
- **Frontend**: HTML + CSS + JavaScript puro (sem React)
- **Banco**: PostgreSQL com fallback local automático
- **Build**: PKG para executáveis nativos

### ✅ **Funcionalidades Completas**
- Criação de artigos com blocos modulares (H1-H6, Parágrafo)
- Pré-visualização em tempo real
- Reordenação de blocos (mover para cima/baixo)
- Geração automática de slug
- Exportação de HTML completo
- Salvamento/carregamento de rascunhos
- Lista de artigos publicados
- Interface responsiva (desktop/tablet/mobile)

### ✅ **Conexão Inteligente**
- Conecta automaticamente ao PostgreSQL quando disponível
- Fallback local transparente (salva em JSON)
- Status de conexão em tempo real
- Migração automática entre modos

## 🚀 Instalação e Uso

### **Versão de Desenvolvimento**

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

### **Versão Executável (Para Distribuição)**

```bash
# 1. Gere os arquivos de distribuição
npm run build

# 2. Gere os executáveis
npm run build-exe

# 3. Distribua os arquivos gerados:
# - EditorArtigos-Windows.exe (para Windows)
# - EditorArtigos-Linux (para Linux)  
# - EditorArtigos-macOS (para macOS)
```

## 📋 Requisitos

### **Para Desenvolvimento:**
- Node.js 18+ 
- NPM ou Yarn
- PostgreSQL (opcional - funciona sem)

### **Para o Redator (Executável):**
- ❌ **Nenhum requisito!**
- Arquivo único executável
- Funciona offline
- Não precisa instalar nada

## 🎯 Como Usar (Redator)

### **1. Informações Básicas**
- Preencha título, categoria e autor
- 16 categorias médicas disponíveis

### **2. Criação de Conteúdo**
- Digite o conteúdo do bloco
- Escolha o tipo (H1-H6 ou Parágrafo)
- Clique "Adicionar Bloco" ou use Ctrl+Enter

### **3. Organização**
- Reordene blocos com botões ↑ ↓
- Remova blocos desnecessários
- Visualize em tempo real

### **4. Finalização**
- Confira na pré-visualização
- Salve rascunho se necessário
- Clique "Publicar Artigo"

## 🔧 Configuração do Banco

### **PostgreSQL (Produção)**
```javascript
// Configuração automática no código
const dbConfig = {
  host: '35.199.101.38',
  port: 5432,
  database: 'liberdade-medica',
  user: 'vinilean',
  password: '-Infra55LM-',
  ssl: { rejectUnauthorized: false }
};
```

### **Modo Local (Desenvolvimento/Offline)**
- Artigos salvos em: `data/artigos.json`
- Estrutura compatível com PostgreSQL
- Migração automática quando conectar

## 📁 Estrutura do Projeto

```
blog-arrumado/
├── backend/
│   └── server.js          # Servidor Express
├── frontend/
│   ├── index.html         # Interface principal
│   ├── styles.css         # Estilos responsivos
│   └── app.js            # Lógica JavaScript
├── scripts/
│   ├── build.js          # Script de build
│   └── build-exe.js      # Geração de executáveis
├── dist/                 # Arquivos de distribuição
├── data/                 # Dados locais
└── package.json          # Configurações
```

## 🎊 Vantagens desta Versão

### **✅ Para Você (Desenvolvedor)**
- Arquitetura simples e manutenível
- Sem dependências complexas
- Build confiável e reproduzível
- Fácil debug e modificação

### **✅ Para o Redator**
- Interface familiar e intuitiva
- Arquivo único executável
- Funciona sem internet
- Não precisa configurar nada

### **✅ Para o Sistema**
- Conecta ao PostgreSQL real
- Fallback local automático
- Dados sempre preservados
- Migração transparente

## 🔄 Comandos Disponíveis

```bash
npm start          # Executar aplicação
npm run dev        # Modo desenvolvimento
npm run build      # Gerar arquivos dist
npm run build-exe  # Gerar executáveis
npm test           # Testar aplicação
```

## 📊 Comparação com Versão Anterior

| Aspecto | Versão Anterior | Versão Arrumada |
|---------|----------------|-----------------|
| **Frontend** | React + Vite | HTML + CSS + JS |
| **Build** | Electron | PKG |
| **Dependências** | Muitas | Mínimas |
| **Tamanho** | ~150MB | ~50MB |
| **Confiabilidade** | Problemas | ✅ Estável |
| **Manutenção** | Complexa | ✅ Simples |

## 🎯 Próximos Passos

1. **Teste a aplicação** localmente
2. **Gere o executável** para Windows
3. **Distribua para o redator**
4. **Colete feedback** de uso
5. **Ajuste conforme necessário**

---

**Versão Arrumada - Simples, Confiável e Funcional!**

*Criado para o Blog Liberdade Médica - Sistema de criação de artigos profissional*
