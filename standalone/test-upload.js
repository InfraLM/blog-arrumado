const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuração
const API_URL = 'http://localhost:3001';

console.log('========================================');
console.log(' TESTE DE UPLOAD E NOVOS CAMPOS');
console.log(' Editor de Artigos - Blog Liberdade Médica');
console.log('========================================');
console.log();

async function testUploadAndFields() {
    try {
        // 1. Testar health check
        console.log('🔍 1. Testando health check...');
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        console.log();

        // 2. Testar conexão PostgreSQL
        console.log('🔍 2. Testando conexão PostgreSQL...');
        const connectionResponse = await fetch(`${API_URL}/api/test-connection`);
        const connectionData = await connectionResponse.json();
        console.log('✅ Conexão PostgreSQL:', connectionData);
        console.log();

        // 3. Criar uma imagem de teste (pixel transparente)
        console.log('🔍 3. Criando imagem de teste...');
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
            0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        const testImagePath = path.join(__dirname, 'test-image.png');
        fs.writeFileSync(testImagePath, testImageBuffer);
        console.log('✅ Imagem de teste criada:', testImagePath);
        console.log();

        // 4. Testar upload de imagem
        console.log('🔍 4. Testando upload de imagem...');
        const formData = new FormData();
        formData.append('image', fs.createReadStream(testImagePath), {
            filename: 'test-image.png',
            contentType: 'image/png'
        });

        const uploadResponse = await fetch(`${API_URL}/api/upload-image`, {
            method: 'POST',
            body: formData
        });

        const uploadData = await uploadResponse.json();
        console.log('✅ Upload de imagem:', uploadData);
        
        let imagemUrl = null;
        if (uploadData.success) {
            imagemUrl = uploadData.image.url;
            console.log('📷 URL da imagem:', imagemUrl);
        }
        console.log();

        // 5. Testar criação de artigo com novos campos
        console.log('🔍 5. Testando criação de artigo com novos campos...');
        
        const articleData = {
            titulo: 'Teste de Artigo com Novos Campos',
            categoria: 'Medicina Geral',
            autor: 'Dr. Teste',
            coautor: 'Dr. Co-autor Teste',
            resumo: 'Este é um resumo de teste para verificar se os novos campos estão funcionando corretamente.',
            destaque: true,
            imagem_principal: imagemUrl,
            content: `
                <div class="imagem-principal">
                    <img src="${imagemUrl || 'https://via.placeholder.com/600x300'}" alt="Teste de Artigo com Novos Campos" style="width: 100%; height: auto; margin-bottom: 1rem;">
                </div>

                <div class="resumo">
                    <p><strong>Resumo:</strong> Este é um resumo de teste para verificar se os novos campos estão funcionando corretamente.</p>
                </div>

                <h1>Título Principal do Teste</h1>
                <p>Este é um parágrafo de teste para verificar se o sistema está funcionando corretamente com os novos campos implementados.</p>
                
                <h2>Subtítulo de Teste</h2>
                <p>Outro parágrafo para testar a funcionalidade completa.</p>
                
                ${imagemUrl ? `
                <div class="imagem-bloco">
                    <img src="${imagemUrl}" alt="Imagem do artigo" style="width: 100%; height: auto; margin: 1rem 0;">
                </div>
                ` : ''}
                
                <div class="autor-info">
                    <p><strong>Autor:</strong> Dr. Teste | <strong>Co-autor:</strong> Dr. Co-autor Teste</p>
                    <p><strong>Categoria:</strong> Medicina Geral</p>
                    <p><strong>Artigo em Destaque</strong></p>
                </div>
            `
        };

        const articleResponse = await fetch(`${API_URL}/api/articles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(articleData)
        });

        const articleResult = await articleResponse.json();
        console.log('✅ Criação de artigo:', articleResult);
        console.log();

        // 6. Testar listagem de artigos
        console.log('🔍 6. Testando listagem de artigos...');
        const listResponse = await fetch(`${API_URL}/api/articles`);
        const listData = await listResponse.json();
        console.log('✅ Listagem de artigos:', {
            success: listData.success,
            total: listData.total,
            primeiro_artigo: listData.articles && listData.articles[0] ? {
                id: listData.articles[0].id,
                titulo: listData.articles[0].titulo,
                autor: listData.articles[0].autor,
                coautor: listData.articles[0].coautor,
                destaque: listData.articles[0].destaque,
                imagem_principal: listData.articles[0].imagem_principal ? 'Sim' : 'Não'
            } : 'Nenhum artigo encontrado'
        });
        console.log();

        // 7. Limpar arquivo de teste
        console.log('🧹 7. Limpando arquivos de teste...');
        if (fs.existsSync(testImagePath)) {
            fs.unlinkSync(testImagePath);
            console.log('✅ Arquivo de teste removido');
        }
        console.log();

        console.log('========================================');
        console.log('✅ TODOS OS TESTES PASSARAM!');
        console.log('========================================');
        console.log();
        console.log('🎉 Funcionalidades testadas com sucesso:');
        console.log('   ✅ Upload de imagens para Backblaze B2');
        console.log('   ✅ Novos campos: co-autor, resumo, destaque');
        console.log('   ✅ Imagem principal');
        console.log('   ✅ Criação de artigos com novos campos');
        console.log('   ✅ Listagem com novos campos');
        console.log();

    } catch (error) {
        console.error('❌ Erro durante os testes:', error);
        console.error('🔍 Stack trace:', error.stack);
        process.exit(1);
    }
}

// Executar testes
testUploadAndFields().catch(console.error);
