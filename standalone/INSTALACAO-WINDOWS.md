# 🖥️ Instalação no Windows
## Editor de Artigos - Blog Liberdade Médica

### 📋 Pré-requisitos

Antes de instalar o aplicativo, certifique-se de ter:

1. **Windows 10 ou superior**
2. **Node.js 18+** instalado
3. **Conexão com internet** (para acessar PostgreSQL)

### 📥 Download do Node.js

Se você não tem o Node.js instalado:

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador e siga as instruções
4. Reinicie o computador após a instalação

### 🔧 Verificar Instalação do Node.js

Abra o **Prompt de Comando** (cmd) e execute:

```cmd
node --version
npm --version
```

Você deve ver as versões instaladas. Exemplo:
```
v18.17.0
9.6.7
```

### 📦 Instalação do Aplicativo

#### Opção 1: Executável Pronto (Recomendado)

1. **Baixe o arquivo ZIP** da pasta `dist/`
2. **Extraia** o conteúdo para uma pasta (ex: `C:\EditorArtigos\`)
3. **Execute** o arquivo `.exe` dentro da pasta extraída

#### Opção 2: Compilar do Código Fonte

1. **Baixe** todos os arquivos do projeto
2. **Abra** o Prompt de Comando como **Administrador**
3. **Navegue** até a pasta do projeto:
   ```cmd
   cd C:\caminho\para\o\projeto\standalone
   ```

4. **Execute** o script de build:
   ```cmd
   build-windows-final.bat
   ```

5. **Aguarde** a conclusão do processo
6. **Encontre** o executável na pasta `dist/`

### 🚀 Primeira Execução

1. **Execute** o aplicativo
2. **Aguarde** a inicialização (pode demorar alguns segundos)
3. **Verifique** o indicador de conexão no canto superior direito:
   - 🟢 **Verde**: Conectado ao PostgreSQL
   - 🟡 **Amarelo**: Modo offline
   - 🔴 **Vermelho**: Erro de conexão

### 🔍 Solução de Problemas

#### ❌ "Node.js não encontrado"
- **Solução**: Instale o Node.js do site oficial
- **Link**: https://nodejs.org/

#### ❌ "Erro ao instalar dependências"
- **Solução**: Execute como Administrador
- **Comando**: Clique com botão direito no cmd → "Executar como administrador"

#### ❌ "Aplicativo não abre"
- **Verificar**: Se o Windows Defender está bloqueando
- **Solução**: Adicionar exceção no antivírus
- **Alternativa**: Executar como Administrador

#### ❌ "Erro de conexão PostgreSQL"
- **Verificar**: Conexão com internet
- **Verificar**: Firewall não está bloqueando
- **Nota**: O aplicativo funciona offline, mas não salva no banco

#### ❌ "Erro ao construir executável"
- **Solução 1**: Liberar espaço em disco (mínimo 2GB)
- **Solução 2**: Fechar outros programas
- **Solução 3**: Executar como Administrador

### 🔧 Configuração do Firewall

Se o Windows Firewall estiver bloqueando:

1. **Abra** o Painel de Controle
2. **Vá** para Sistema e Segurança → Windows Defender Firewall
3. **Clique** em "Permitir um aplicativo pelo Firewall"
4. **Adicione** o executável do Editor de Artigos
5. **Marque** as caixas "Privada" e "Pública"

### 🔒 Configuração do Antivírus

Alguns antivírus podem bloquear o aplicativo:

#### Windows Defender
1. **Abra** Windows Security
2. **Vá** para Proteção contra vírus e ameaças
3. **Clique** em "Gerenciar configurações" (Proteção em tempo real)
4. **Adicione** uma exclusão para a pasta do aplicativo

#### Outros Antivírus
- **Adicione** a pasta do aplicativo às exceções
- **Permita** conexões de rede para o aplicativo

### 📁 Estrutura de Pastas Recomendada

```
C:\EditorArtigos\
├── Editor de Artigos.exe
├── resources\
├── locales\
└── ... (outros arquivos)
```

### 🔄 Atualizações

Para atualizar o aplicativo:

1. **Baixe** a nova versão
2. **Feche** o aplicativo atual
3. **Substitua** os arquivos antigos
4. **Execute** a nova versão

### 📊 Verificação de Funcionamento

Após a instalação, teste:

1. **✅ Aplicativo abre** sem erros
2. **✅ Interface carrega** completamente
3. **✅ Indicador de conexão** aparece no canto superior direito
4. **✅ Consegue criar** um artigo de teste
5. **✅ Preview funciona** corretamente

### 🆘 Suporte Técnico

Se ainda tiver problemas:

1. **Anote** a mensagem de erro exata
2. **Tire** uma captura de tela
3. **Verifique** os logs no console (F12 → Console)
4. **Entre em contato** com o suporte técnico

### 📞 Contato

- **Email**: suporte@liberdademedica.com.br
- **Telefone**: (11) 99999-9999
- **Horário**: Segunda a Sexta, 9h às 18h

### 💡 Dicas de Uso

- **Salve rascunhos** regularmente
- **Teste a conexão** antes de escrever artigos longos
- **Use Ctrl+Enter** para adicionar blocos rapidamente
- **Mantenha** o aplicativo atualizado

---

**🎉 Pronto! Seu Editor de Artigos está instalado e funcionando!**

*Para mais informações, consulte o arquivo README-FINAL.md*
