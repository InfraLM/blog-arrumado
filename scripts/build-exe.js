#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================');
console.log(' BUILD EXECUTÁVEL - Editor de Artigos');
console.log(' Blog Liberdade Médica');
console.log('========================================');
console.log('');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

// Verificar se dist existe
if (!fs.existsSync(distDir)) {
    console.log('❌ Diretório dist não encontrado!');
    console.log('Execute primeiro: npm run build');
    process.exit(1);
}

// Verificar se pkg está instalado
try {
    execSync('npx pkg --version', { stdio: 'ignore' });
    console.log('✅ PKG encontrado');
} catch (error) {
    console.log('⚠️  PKG não encontrado, instalando...');
    try {
        execSync('npm install -g pkg', { stdio: 'inherit' });
        console.log('✅ PKG instalado');
    } catch (installError) {
        console.log('❌ Erro ao instalar PKG');
        console.log('Tente instalar manualmente: npm install -g pkg');
        process.exit(1);
    }
}

// Navegar para dist
process.chdir(distDir);
console.log(`📁 Diretório atual: ${process.cwd()}`);

// Instalar dependências se necessário
if (!fs.existsSync('node_modules')) {
    console.log('📦 Instalando dependências...');
    try {
        execSync('npm install --production', { stdio: 'inherit' });
        console.log('✅ Dependências instaladas');
    } catch (error) {
        console.log('❌ Erro ao instalar dependências');
        process.exit(1);
    }
}

// Criar configuração PKG
const pkgConfig = {
    "name": "editor-artigos-blog",
    "version": "1.0.0",
    "main": "server.js",
    "bin": "server.js",
    "pkg": {
        "assets": [
            "index.html",
            "styles.css", 
            "app.js",
            "data/**/*"
        ],
        "targets": [
            "node18-win-x64",
            "node18-linux-x64",
            "node18-macos-x64"
        ],
        "outputPath": "../"
    }
};

// Atualizar package.json com configuração PKG
const packagePath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
Object.assign(packageJson, pkgConfig);
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
console.log('✅ Configuração PKG adicionada');

// Gerar executáveis
console.log('');
console.log('🔨 Gerando executáveis...');
console.log('Isso pode demorar alguns minutos...');
console.log('');

try {
    // Windows
    console.log('📦 Gerando executável para Windows...');
    execSync('npx pkg . --target node18-win-x64 --output ../EditorArtigos-Windows.exe', { 
        stdio: 'inherit' 
    });
    console.log('✅ Windows: EditorArtigos-Windows.exe');

    // Linux
    console.log('📦 Gerando executável para Linux...');
    execSync('npx pkg . --target node18-linux-x64 --output ../EditorArtigos-Linux', { 
        stdio: 'inherit' 
    });
    console.log('✅ Linux: EditorArtigos-Linux');

    // macOS
    console.log('📦 Gerando executável para macOS...');
    execSync('npx pkg . --target node18-macos-x64 --output ../EditorArtigos-macOS', { 
        stdio: 'inherit' 
    });
    console.log('✅ macOS: EditorArtigos-macOS');

} catch (error) {
    console.log('⚠️  Erro em alguns executáveis, tentando apenas Windows...');
    try {
        execSync('npx pkg . --target node18-win-x64 --output ../EditorArtigos.exe', { 
            stdio: 'inherit' 
        });
        console.log('✅ Windows: EditorArtigos.exe');
    } catch (winError) {
        console.log('❌ Erro ao gerar executável Windows');
        console.log('Erro:', winError.message);
        process.exit(1);
    }
}

// Voltar para diretório raiz
process.chdir(rootDir);

// Verificar arquivos gerados
console.log('');
console.log('========================================');
console.log(' EXECUTÁVEIS GERADOS COM SUCESSO!');
console.log('========================================');
console.log('');

const executables = [
    'EditorArtigos-Windows.exe',
    'EditorArtigos-Linux', 
    'EditorArtigos-macOS',
    'EditorArtigos.exe'
];

executables.forEach(exe => {
    const exePath = path.join(rootDir, exe);
    if (fs.existsSync(exePath)) {
        const stats = fs.statSync(exePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        console.log(`✅ ${exe} (${sizeMB} MB)`);
    }
});

console.log('');
console.log('📋 INSTRUÇÕES PARA DISTRIBUIÇÃO:');
console.log('');
console.log('1. Para Windows: Envie EditorArtigos-Windows.exe');
console.log('2. Para Linux: Envie EditorArtigos-Linux');
console.log('3. Para macOS: Envie EditorArtigos-macOS');
console.log('');
console.log('📋 COMO O REDATOR USA:');
console.log('');
console.log('1. Baixa o arquivo executável');
console.log('2. Executa (duplo clique no Windows)');
console.log('3. Aguarda servidor iniciar');
console.log('4. Navegador abre automaticamente');
console.log('5. Usa a interface normalmente');
console.log('6. Artigos salvos em data/artigos.json');
console.log('');
console.log('✅ VANTAGENS:');
console.log('- Arquivo único (não precisa instalar nada)');
console.log('- Funciona offline');
console.log('- Interface idêntica à versão web');
console.log('- Conecta ao PostgreSQL quando disponível');
console.log('- Fallback local automático');
console.log('');
console.log('========================================');
