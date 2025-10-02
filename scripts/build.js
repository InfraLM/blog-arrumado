#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log(' BUILD - Editor de Artigos');
console.log(' Blog Liberdade Médica');
console.log('========================================');
console.log('');

// Diretórios
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// Limpar diretório dist
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Diretório dist limpo');
}

// Criar diretório dist
fs.mkdirSync(distDir, { recursive: true });
console.log('✅ Diretório dist criado');

// Copiar arquivos do backend
const backendFiles = ['server.js'];
backendFiles.forEach(file => {
    const src = path.join(backendDir, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copiado: ${file}`);
    }
});

// Copiar arquivos do frontend
const frontendFiles = ['index.html', 'styles.css', 'app.js'];
frontendFiles.forEach(file => {
    const src = path.join(frontendDir, file);
    const dest = path.join(distDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copiado: ${file}`);
    }
});

// Copiar package.json
const packageSrc = path.join(rootDir, 'package.json');
const packageDest = path.join(distDir, 'package.json');
fs.copyFileSync(packageSrc, packageDest);
console.log('✅ Copiado: package.json');

// Criar diretório data
const dataDir = path.join(distDir, 'data');
fs.mkdirSync(dataDir, { recursive: true });
console.log('✅ Diretório data criado');

// Criar arquivo README para dist
const readmeContent = `# Editor de Artigos - Blog Liberdade Médica

## Como usar esta versão:

1. Instale as dependências:
   \`\`\`
   npm install
   \`\`\`

2. Execute a aplicação:
   \`\`\`
   npm start
   \`\`\`

3. Acesse: http://localhost:3000

## Arquivos incluídos:

- server.js: Servidor backend
- index.html: Interface principal
- styles.css: Estilos da aplicação
- app.js: Lógica JavaScript
- package.json: Configurações e dependências
- data/: Diretório para artigos locais

## Funcionalidades:

✅ Criação de artigos com blocos modulares
✅ Conexão com PostgreSQL (com fallback local)
✅ Pré-visualização em tempo real
✅ Exportação de HTML
✅ Salvamento de rascunhos
✅ Interface responsiva

Gerado em: ${new Date().toLocaleString('pt-BR')}
`;

fs.writeFileSync(path.join(distDir, 'README.md'), readmeContent);
console.log('✅ README.md criado');

console.log('');
console.log('========================================');
console.log(' BUILD CONCLUÍDO COM SUCESSO!');
console.log('========================================');
console.log('');
console.log(`📁 Arquivos gerados em: ${distDir}`);
console.log('');
console.log('Para testar:');
console.log('1. cd dist');
console.log('2. npm install');
console.log('3. npm start');
console.log('');
console.log('Para gerar executável:');
console.log('npm run build-exe');
console.log('========================================');
