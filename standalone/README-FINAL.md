# Editor de Artigos - Blog Liberdade Médica
## Aplicativo Desktop com Servidor Backend Integrado

### 📋 Descrição

Este é um aplicativo desktop desenvolvido com **Electron** que integra um **servidor Node.js** para conectar diretamente com o banco de dados **PostgreSQL** do blog. O aplicativo permite criar, editar e publicar artigos diretamente no banco de dados, mantendo uma conexão ativa durante toda a sessão.

### ✨ Características Principais

- **🖥️ Aplicativo Desktop**: Interface nativa para Windows, Mac e Linux
- **🔗 Servidor Integrado**: Backend Node.js executando dentro do Electron
- **🐘 PostgreSQL**: Conexão direta com o banco de dados do blog
- **📝 Editor de Blocos**: Sistema de blocos para criação de conteúdo (H1-H6, parágrafos)
- **💾 Rascunhos**: Salvar e carregar rascunhos localmente
- **📤 Exportação**: Exportar artigos em formato HTML
- **🔄 Sincronização**: Visualização em tempo real dos artigos publicados

### 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│           APLICATIVO ELECTRON           │
├─────────────────────────────────────────┤
│  Frontend (React-like)                  │
│  - Interface de usuário                 │
│  - Editor de blocos                     │
│  - Preview em tempo real                │
├─────────────────────────────────────────┤
│  Backend Integrado (Node.js/Express)   │
│  - Servidor HTTP local                  │
│  - APIs REST                            │
│  - Conexão PostgreSQL                   │
├─────────────────────────────────────────┤
│  Banco de Dados (PostgreSQL)           │
│  - Tabela: public.blog_artigos         │
│  - Host: 35.199.101.38:5432           │
│  - Database: liberdade-medica          │
└─────────────────────────────────────────┘
```

### 🚀 Funcionalidades

#### ✍️ Criação de Artigos
- **Título**: Campo obrigatório para o título do artigo
- **Categoria**: Seleção de categoria (Medicina Geral, Cardiologia, etc.)
- **Autor**: Nome do autor do artigo
- **Sistema de Blocos**: Adicionar blocos de conteúdo:
  - H1, H2, H3, H4, H5, H6 (títulos)
  - Parágrafos de texto
- **Preview**: Visualização em tempo real do artigo
- **Publicação**: Envio direto para o banco PostgreSQL

#### 💾 Gerenciamento de Rascunhos
- **Salvar Rascunho**: Salvar trabalho em progresso em arquivo JSON
- **Carregar Rascunho**: Recuperar rascunho salvo anteriormente
- **Auto-validação**: Verificação de campos obrigatórios

#### 📤 Exportação
- **HTML**: Exportar artigo completo em formato HTML
- **Estrutura completa**: Inclui metadados e estilos CSS

#### 🔍 Visualização de Artigos
- **Lista de Artigos**: Visualizar artigos recentes do banco
- **Detalhes**: ID, título, categoria, autor, data de criação
- **Atualização automática**: Lista atualizada após publicação

### 🔧 Configuração Técnica

#### Dependências Principais
```json
{
  "electron": "^27.0.0",
  "express": "^4.18.2",
  "pg": "^8.11.3",
  "cors": "^2.8.5"
}
```

#### Configuração do Banco
```javascript
const dbConfig = {
  host: '35.199.101.38',
  port: 5432,
  database: 'liberdade-medica',
  user: 'vinilean',
  password: '-Infra55LM-',
  ssl: false
};
```

#### Estrutura da Tabela
```sql
CREATE TABLE public.blog_artigos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR NOT NULL,
  slug VARCHAR NOT NULL,
  categoria VARCHAR,
  autor VARCHAR,
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_atualizacao DATE DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  status VARCHAR DEFAULT 'publicado',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📦 Instalação e Uso

#### Pré-requisitos
- **Node.js** 18+ instalado
- **npm** ou **yarn**
- Conexão com internet (para acessar PostgreSQL)

#### Instalação
```bash
# 1. Instalar dependências
npm install

# 2. Testar conexão com banco
node test-db.js

# 3. Executar aplicativo
npm start
```

#### Build para Produção
```bash
# Windows
npm run build-win

# Mac
npm run build-mac

# Linux
npm run build-linux

# Todas as plataformas
npm run build-all
```

### 🔌 APIs Disponíveis

O servidor integrado expõe as seguintes APIs:

#### GET /api/test-connection
Testa a conexão com PostgreSQL
```json
{
  "success": true,
  "message": "✅ PostgreSQL conectado",
  "mode": "postgresql",
  "status": "connected"
}
```

#### GET /api/articles
Lista artigos recentes
```json
{
  "success": true,
  "articles": [...],
  "total": 5
}
```

#### POST /api/articles
Cria novo artigo
```json
{
  "titulo": "Título do Artigo",
  "categoria": "Medicina Geral",
  "autor": "Dr. João Silva",
  "content": "<h1>Conteúdo HTML</h1>"
}
```

#### GET /health
Health check do servidor
```json
{
  "status": "ok",
  "postgresql": "connected",
  "port": 3001
}
```

### 🔍 Indicadores de Status

O aplicativo possui indicadores visuais de status:

- **🟢 PostgreSQL**: Conectado ao banco de dados
- **🟡 Offline**: Sem conexão com o banco
- **🔴 Erro**: Erro na conexão ou servidor

### 🛠️ Desenvolvimento

#### Estrutura de Arquivos
```
standalone/
├── main.js              # Processo principal do Electron
├── app.js               # Frontend da aplicação
├── index.html           # Interface HTML
├── styles.css           # Estilos CSS
├── package.json         # Configuração do projeto
├── test-db.js          # Teste de conexão PostgreSQL
├── test-server.js      # Teste do servidor integrado
└── assets/
    └── icon.png        # Ícone do aplicativo
```

#### Scripts Disponíveis
- `npm start`: Executar aplicativo em desenvolvimento
- `npm run build`: Construir para todas as plataformas
- `npm run build-win`: Construir para Windows
- `npm run build-mac`: Construir para Mac
- `npm run build-linux`: Construir para Linux

### 🧪 Testes

#### Teste de Conexão PostgreSQL
```bash
node test-db.js
```

#### Teste do Servidor Integrado
```bash
node test-server.js
```

### 🔒 Segurança

- **Conexão Local**: Servidor backend executa apenas em localhost
- **Validação de Dados**: Validação completa de entrada nos endpoints
- **Tratamento de Erros**: Logs detalhados e tratamento de exceções
- **Timeouts**: Configuração de timeouts para conexões PostgreSQL

### 📊 Logs e Monitoramento

O aplicativo gera logs detalhados:

```
========================================
 EDITOR DE ARTIGOS - SERVIDOR INTEGRADO
 Blog Liberdade Médica
========================================
🚀 Iniciando servidor backend...
🔄 Conectando ao PostgreSQL...
📍 Host: 35.199.101.38:5432
📊 Database: liberdade-medica
✅ PostgreSQL conectado: 2025-10-03T15:18:47.778Z
📊 Versão: PostgreSQL 17.5
✅ Tabela blog_artigos encontrada
📄 Artigos existentes: 5
✅ Servidor backend iniciado na porta 3001
🖥️ Criando janela da aplicação...
```

### 🐛 Solução de Problemas

#### Erro de Conexão PostgreSQL
1. Verificar conectividade de rede
2. Confirmar credenciais do banco
3. Executar `node test-db.js` para diagnóstico

#### Aplicativo não abre
1. Verificar se Node.js está instalado
2. Executar `npm install` para instalar dependências
3. Verificar logs no console

#### Erro ao construir executável
1. Instalar dependências: `npm install`
2. Para Windows: Instalar Wine no Linux ou usar Windows nativo
3. Verificar espaço em disco disponível

### 📈 Melhorias Futuras

- **🔐 Autenticação**: Sistema de login para múltiplos usuários
- **📷 Upload de Imagens**: Suporte para imagens nos artigos
- **🎨 Editor WYSIWYG**: Editor visual mais avançado
- **🔄 Sincronização**: Sincronização automática com o blog
- **📱 Responsividade**: Interface adaptável para diferentes tamanhos de tela

### 📞 Suporte

Para suporte técnico ou dúvidas:
- **Email**: suporte@liberdademedica.com.br
- **Documentação**: Este arquivo README
- **Logs**: Verificar console do aplicativo para detalhes de erro

### 📄 Licença

Este projeto é propriedade da **Liberdade Médica** e está licenciado sob os termos da licença MIT.

---

**Desenvolvido com ❤️ para a Liberdade Médica**  
*Versão 1.1.0 - Outubro 2025*
