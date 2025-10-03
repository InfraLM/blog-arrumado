#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log(' BUILD STANDALONE - Editor de Artigos');
console.log(' Aplicativo Desktop Nativo');
console.log('========================================');
console.log('');

// Verificar se dependências estão instaladas
if (!fs.existsSync('node_modules')) {
    console.log('📦 Instalando dependências...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependências instaladas');
    } catch (error) {
        console.log('❌ Erro ao instalar dependências');
        process.exit(1);
    }
}

// Limpar diretório dist
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Diretório dist limpo');
}

console.log('');
console.log('🔨 Gerando aplicativos desktop...');
console.log('Isso pode demorar alguns minutos...');
console.log('');

try {
    // Windows - Portátil e ZIP
    console.log('📦 Gerando para Windows...');
    execSync('npm run build-win', { stdio: 'inherit' });
    console.log('✅ Windows concluído');

    // macOS
    console.log('📦 Gerando para macOS...');
    execSync('npm run build-mac', { stdio: 'inherit' });
    console.log('✅ macOS concluído');

    // Linux
    console.log('📦 Gerando para Linux...');
    execSync('npm run build-linux', { stdio: 'inherit' });
    console.log('✅ Linux concluído');

} catch (error) {
    console.log('⚠️  Erro em algumas plataformas, tentando apenas Windows...');
    try {
        execSync('npm run build-win', { stdio: 'inherit' });
        console.log('✅ Windows gerado com sucesso');
    } catch (winError) {
        console.log('❌ Erro ao gerar aplicativo Windows');
        console.log('Erro:', winError.message);
        process.exit(1);
    }
}

console.log('');
console.log('========================================');
console.log(' APLICATIVOS DESKTOP GERADOS!');
console.log('========================================');
console.log('');

// Verificar arquivos gerados
const distFiles = fs.readdirSync(distDir);
console.log('📁 Arquivos gerados:');
distFiles.forEach(file => {
    const filePath = path.join(distDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile()) {
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        console.log(`✅ ${file} (${sizeMB} MB)`);
    } else if (stats.isDirectory()) {
        console.log(`📁 ${file}/`);
    }
});

console.log('');
console.log('📋 INSTRUÇÕES PARA DISTRIBUIÇÃO:');
console.log('');
console.log('🖥️  WINDOWS:');
console.log('- EditorArtigos-Portable.exe (arquivo único)');
console.log('- win-unpacked/ (pasta completa)');
console.log('- Editor de Artigos - Blog Liberdade Médica-1.0.0.zip');
console.log('');
console.log('🍎 MACOS:');
console.log('- Editor de Artigos - Blog Liberdade Médica-1.0.0-mac.zip');
console.log('');
console.log('🐧 LINUX:');
console.log('- Editor de Artigos - Blog Liberdade Médica-1.0.0.AppImage');
console.log('- linux-unpacked/');
console.log('');
console.log('📋 COMO O REDATOR USA:');
console.log('');
console.log('1️⃣ WINDOWS (Mais Fácil):');
console.log('   - Baixa: EditorArtigos-Portable.exe');
console.log('   - Executa: Duplo clique');
console.log('   - Resultado: Janela do aplicativo abre');
console.log('');
console.log('2️⃣ WINDOWS (Pasta):');
console.log('   - Baixa: win-unpacked.zip');
console.log('   - Extrai a pasta');
console.log('   - Executa: Editor de Artigos.exe');
console.log('');
console.log('3️⃣ MACOS:');
console.log('   - Baixa: mac.zip');
console.log('   - Extrai e arrasta para Applications');
console.log('   - Executa normalmente');
console.log('');
console.log('4️⃣ LINUX:');
console.log('   - Baixa: .AppImage');
console.log('   - Torna executável: chmod +x arquivo.AppImage');
console.log('   - Executa: ./arquivo.AppImage');
console.log('');
console.log('✅ VANTAGENS:');
console.log('- Aplicativo desktop nativo');
console.log('- Não abre navegador');
console.log('- Janela própria do sistema');
console.log('- Banco SQLite local');
console.log('- Diálogos nativos para salvar/abrir');
console.log('- Funciona completamente offline');
console.log('- Interface idêntica');
console.log('');
console.log('========================================');
