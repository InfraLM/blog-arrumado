# Editor de Artigos - Aplicativo Desktop Standalone

Versão desktop nativa que **NÃO precisa de Node.js** e abre uma janela própria no computador.

## 🎯 Características

### ✅ **Aplicativo Desktop Nativo**
- **Janela própria** do sistema operacional
- **Não abre navegador** - interface nativa
- **Banco SQLite local** - dados salvos no computador
- **Diálogos nativos** para salvar/abrir arquivos
- **Funciona completamente offline**

### ✅ **Para o Redator**
- **Não precisa instalar Node.js**
- **Não precisa configurar nada**
- **Arquivo único executável**
- **Interface idêntica** à versão web
- **Duplo clique e funciona**

## 🚀 Como Gerar os Aplicativos

### **No Windows:**
```cmd
# 1. Instalar dependências
npm install

# 2. Gerar aplicativo
npm run build-win

# 3. Ou usar script automático
build-windows.bat
```

### **Multiplataforma:**
```cmd
# Gerar para todas as plataformas
node build.js
```

## 📁 Arquivos Gerados

### **Windows:**
- `EditorArtigos-Portable.exe` - **Arquivo único (RECOMENDADO)**
- `win-unpacked/` - Pasta completa
- `Editor de Artigos - Blog Liberdade Médica-1.0.0.zip` - ZIP para distribuição

### **macOS:**
- `Editor de Artigos - Blog Liberdade Médica-1.0.0-mac.zip`

### **Linux:**
- `Editor de Artigos - Blog Liberdade Médica-1.0.0.AppImage`
- `linux-unpacked/`

## 📋 Instruções para o Redator

### **🖥️ Windows (Mais Fácil):**
1. **Baixa** o arquivo `EditorArtigos-Portable.exe`
2. **Salva** em qualquer pasta (ex: Desktop)
3. **Executa** com duplo clique
4. **Janela do aplicativo abre** automaticamente
5. **Usa** normalmente - interface idêntica

### **🖥️ Windows (Pasta):**
1. **Baixa** o arquivo `win-unpacked.zip`
2. **Extrai** a pasta
3. **Executa** `Editor de Artigos.exe` dentro da pasta

### **🍎 macOS:**
1. **Baixa** o arquivo `mac.zip`
2. **Extrai** e arrasta para Applications
3. **Executa** normalmente

### **🐧 Linux:**
1. **Baixa** o arquivo `.AppImage`
2. **Torna executável:** `chmod +x arquivo.AppImage`
3. **Executa:** `./arquivo.AppImage`

## 🎊 Vantagens da Versão Desktop

### **✅ Para o Redator:**
- **Não precisa de conhecimento técnico**
- **Não precisa instalar Node.js**
- **Aplicativo nativo do sistema**
- **Janela própria (não é navegador)**
- **Diálogos familiares** (salvar/abrir)
- **Funciona offline**

### **✅ Para Você:**
- **Distribuição simples** - arquivo único
- **Sem dependências externas**
- **Funciona em qualquer computador**
- **Não precisa servidor**
- **Dados locais seguros**

### **✅ Para o Sistema:**
- **Banco SQLite local** - rápido e confiável
- **Dados preservados** no computador
- **Backup automático** dos artigos
- **Performance nativa**

## 🔧 Funcionalidades

### **Idênticas à Versão Web:**
- ✅ Criação de artigos com blocos modulares
- ✅ Pré-visualização em tempo real
- ✅ Reordenação de blocos
- ✅ Geração automática de slug
- ✅ 16 categorias médicas
- ✅ Interface responsiva

### **Exclusivas da Versão Desktop:**
- ✅ **Diálogos nativos** para salvar/carregar rascunhos
- ✅ **Exportação HTML** com diálogo nativo
- ✅ **Banco SQLite** local e rápido
- ✅ **Dados seguros** no computador
- ✅ **Sem dependência de internet**

## 📊 Comparação das Versões

| Aspecto | Versão Web | Versão Desktop |
|---------|------------|----------------|
| **Instalação** | Precisa Node.js | ❌ Não precisa nada |
| **Interface** | Navegador | ✅ Janela nativa |
| **Dados** | PostgreSQL/JSON | ✅ SQLite local |
| **Offline** | Limitado | ✅ Completo |
| **Distribuição** | Complexa | ✅ Arquivo único |
| **Redator** | Técnico | ✅ Simples |

## 🎯 Recomendação

### **Use a Versão Desktop quando:**
- ✅ Redator não tem conhecimento técnico
- ✅ Quer máxima simplicidade
- ✅ Prefere aplicativo nativo
- ✅ Não quer depender de servidor
- ✅ Quer dados locais seguros

### **Use a Versão Web quando:**
- ✅ Múltiplos redatores
- ✅ Acesso remoto necessário
- ✅ Integração com PostgreSQL obrigatória
- ✅ Tem infraestrutura de servidor

## 🔧 Desenvolvimento

### **Estrutura:**
```
standalone/
├── main.js           # Processo principal Electron
├── index.html        # Interface (copiada do frontend)
├── styles.css        # Estilos (copiados do frontend)
├── app.js           # Lógica desktop (adaptada)
├── package.json      # Configurações Electron
├── build.js         # Script de build
└── assets/          # Ícones e recursos
```

### **Tecnologias:**
- **Electron** - Framework desktop
- **SQLite** - Banco local
- **HTML/CSS/JS** - Interface (mesma do web)
- **electron-builder** - Geração de executáveis

---

**🎊 Resultado: Aplicativo desktop profissional que o redator usa sem complicações!**
