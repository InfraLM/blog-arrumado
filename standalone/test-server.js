const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const path = require('path');

// Variáveis globais
let serverApp;
let server;
let pgClient = null;
let serverPort = 3001;

// Configuração do banco PostgreSQL
const dbConfig = {
  host: '35.199.101.38',
  port: 5432,
  database: 'liberdade-medica',
  user: 'vinilean',
  password: '-Infra55LM-',
  ssl: false,
  connectionTimeoutMillis: 30000,
  query_timeout: 30000,
  statement_timeout: 30000,
  idle_in_transaction_session_timeout: 30000
};

// Conectar ao PostgreSQL
async function initPostgreSQL() {
  try {
    pgClient = new Client(dbConfig);
    console.log('🔄 Conectando ao PostgreSQL...');
    console.log('📍 Host:', dbConfig.host + ':' + dbConfig.port);
    console.log('📊 Database:', dbConfig.database);
    
    await pgClient.connect();
    
    // Testar conexão
    const result = await pgClient.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ PostgreSQL conectado:', result.rows[0].current_time);
    console.log('📊 Versão:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Verificar tabela
    const tableCheck = await pgClient.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_artigos'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela blog_artigos encontrada');
      
      // Contar artigos existentes
      const countResult = await pgClient.query('SELECT COUNT(*) as total FROM public.blog_artigos');
      console.log(`📄 Artigos existentes: ${countResult.rows[0].total}`);
    } else {
      console.log('⚠️ Tabela blog_artigos não encontrada');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error.message);
    pgClient = null;
    return false;
  }
}

// Função para gerar slug
function generateSlug(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Garantir slug único
async function ensureUniqueSlug(baseSlug, excludeId = null) {
  if (!pgClient) return baseSlug;
  
  try {
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const query = excludeId 
        ? 'SELECT id FROM public.blog_artigos WHERE slug = $1 AND id != $2'
        : 'SELECT id FROM public.blog_artigos WHERE slug = $1';
      
      const params = excludeId ? [slug, excludeId] : [slug];
      const result = await pgClient.query(query, params);
      
      if (result.rows.length === 0) {
        return slug;
      }
      
      slug = `${baseSlug}_${counter}`;
      counter++;
    }
  } catch (error) {
    console.error('Erro ao verificar slug único:', error);
    return baseSlug;
  }
}

// Configurar rotas da API
function setupRoutes() {
  // Rota de teste de conexão
  serverApp.get('/api/test-connection', async (req, res) => {
    try {
      if (pgClient) {
        await pgClient.query('SELECT 1');
        res.json({
          success: true,
          message: '✅ PostgreSQL conectado - dados salvos no banco',
          mode: 'postgresql',
          status: 'connected',
          timestamp: new Date().toISOString(),
          server_port: serverPort
        });
      } else {
        res.json({
          success: false,
          message: '❌ PostgreSQL desconectado - modo offline',
          mode: 'offline',
          status: 'disconnected',
          timestamp: new Date().toISOString(),
          server_port: serverPort
        });
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      res.json({
        success: false,
        message: '❌ Erro na conexão: ' + error.message,
        mode: 'offline',
        status: 'error',
        timestamp: new Date().toISOString(),
        server_port: serverPort
      });
    }
  });

  // Listar artigos
  serverApp.get('/api/articles', async (req, res) => {
    try {
      if (!pgClient) {
        return res.status(500).json({
          success: false,
          message: 'PostgreSQL não conectado',
          articles: []
        });
      }

      const result = await pgClient.query(`
        SELECT id, titulo, categoria, autor, data_criacao, status, slug, created_at
        FROM public.blog_artigos 
        ORDER BY created_at DESC 
        LIMIT 20
      `);

      const articles = result.rows.map(row => ({
        id: row.id,
        titulo: row.titulo,
        categoria: row.categoria,
        autor: row.autor,
        data_criacao: row.data_criacao,
        status: row.status,
        slug: row.slug,
        created_at: row.created_at
      }));

      res.json({
        success: true,
        articles: articles,
        mode: 'postgresql',
        total: result.rows.length
      });
    } catch (error) {
      console.error('Erro ao listar artigos:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        articles: []
      });
    }
  });

  // Criar artigo
  serverApp.post('/api/articles', async (req, res) => {
    try {
      const { titulo, categoria, autor, content } = req.body;

      console.log('📝 Nova requisição de criação de artigo:', {
        titulo: titulo ? titulo.substring(0, 50) + '...' : 'N/A',
        categoria: categoria || 'N/A',
        autor: autor || 'N/A',
        content_length: content ? content.length : 0
      });

      // Validação detalhada
      const errors = [];
      if (!titulo || titulo.trim().length === 0) errors.push('Título é obrigatório');
      if (!categoria || categoria.trim().length === 0) errors.push('Categoria é obrigatória');
      if (!autor || autor.trim().length === 0) errors.push('Autor é obrigatório');
      if (!content || content.trim().length === 0) errors.push('Conteúdo é obrigatório');

      if (errors.length > 0) {
        console.log('❌ Validação falhou:', errors);
        return res.status(400).json({
          success: false,
          message: 'Erros de validação: ' + errors.join(', '),
          errors: errors
        });
      }

      if (!pgClient) {
        console.log('❌ PostgreSQL não conectado');
        return res.status(500).json({
          success: false,
          message: 'PostgreSQL não conectado - verifique a conexão com o banco'
        });
      }

      const slug = generateSlug(titulo.trim());
      const finalSlug = await ensureUniqueSlug(slug);
      const now = new Date();

      console.log('🔄 Inserindo artigo no banco:', {
        titulo: titulo.trim(),
        slug: finalSlug,
        categoria: categoria.trim(),
        autor: autor.trim()
      });

      const insertQuery = `
        INSERT INTO public.blog_artigos 
        (titulo, slug, categoria, autor, data_criacao, data_atualizacao, content, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, slug, titulo, categoria, autor, created_at
      `;

      const values = [
        titulo.trim(),
        finalSlug,
        categoria.trim(),
        autor.trim(),
        now.toISOString().split('T')[0],
        now.toISOString().split('T')[0],
        content.trim(),
        'publicado',
        now.toISOString(),
        now.toISOString()
      ];

      const result = await pgClient.query(insertQuery, values);
      const insertedArticle = result.rows[0];
      
      console.log('✅ Artigo inserido com sucesso no PostgreSQL:', {
        id: insertedArticle.id,
        slug: insertedArticle.slug,
        titulo: insertedArticle.titulo,
        categoria: insertedArticle.categoria,
        autor: insertedArticle.autor,
        created_at: insertedArticle.created_at
      });

      res.json({
        success: true,
        id: insertedArticle.id,
        slug: insertedArticle.slug,
        message: '✅ Artigo publicado no blog com sucesso!',
        mode: 'postgresql',
        timestamp: now.toISOString(),
        article: {
          id: insertedArticle.id,
          titulo: insertedArticle.titulo,
          categoria: insertedArticle.categoria,
          autor: insertedArticle.autor,
          slug: insertedArticle.slug
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar artigo:', error.message);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar artigo',
        error_details: error.message
      });
    }
  });

  // Health check
  serverApp.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      postgresql: pgClient ? 'connected' : 'disconnected',
      port: serverPort
    });
  });
}

// Inicializar servidor Express
async function initServer() {
  return new Promise((resolve, reject) => {
    serverApp = express();
    
    // Middlewares
    serverApp.use(cors());
    serverApp.use(express.json({ limit: '10mb' }));
    serverApp.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Servir arquivos estáticos (frontend)
    serverApp.use(express.static(path.join(__dirname)));
    
    // Configurar rotas da API
    setupRoutes();
    
    server = serverApp.listen(serverPort, 'localhost', () => {
      console.log(`✅ Servidor backend iniciado na porta ${serverPort}`);
      resolve(serverPort);
    });
    
    server.on('error', (err) => {
      console.error('❌ Erro no servidor:', err);
      reject(err);
    });
  });
}

// Função de teste das APIs
async function testAPIs() {
  console.log('\n🧪 TESTANDO APIs DO SERVIDOR');
  console.log('========================================');
  
  try {
    // Teste 1: Health check
    console.log('🔄 Teste 1: Health check...');
    const healthResponse = await fetch(`http://localhost:${serverPort}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Teste 2: Test connection
    console.log('\n🔄 Teste 2: Test connection...');
    const connResponse = await fetch(`http://localhost:${serverPort}/api/test-connection`);
    const connData = await connResponse.json();
    console.log('✅ Test connection:', connData);
    
    // Teste 3: Listar artigos
    console.log('\n🔄 Teste 3: Listar artigos...');
    const articlesResponse = await fetch(`http://localhost:${serverPort}/api/articles`);
    const articlesData = await articlesResponse.json();
    console.log('✅ Artigos encontrados:', articlesData.total || 0);
    
    // Teste 4: Criar artigo de teste
    console.log('\n🔄 Teste 4: Criar artigo de teste...');
    const testArticle = {
      titulo: 'Teste de Integração - Servidor Backend',
      categoria: 'Teste',
      autor: 'Sistema de Teste Automatizado',
      content: '<h1>Teste de Integração</h1><p>Este é um artigo de teste criado automaticamente para verificar a integração do servidor backend com PostgreSQL.</p><p>Timestamp: ' + new Date().toISOString() + '</p>'
    };
    
    const createResponse = await fetch(`http://localhost:${serverPort}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testArticle)
    });
    
    const createData = await createResponse.json();
    console.log('✅ Artigo criado:', createData);
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Função principal
async function main() {
  try {
    console.log('========================================');
    console.log(' TESTE DO SERVIDOR BACKEND INTEGRADO');
    console.log(' Blog Liberdade Médica');
    console.log('========================================');
    
    // Conectar ao PostgreSQL
    await initPostgreSQL();
    
    // Inicializar servidor
    await initServer();
    
    // Aguardar um pouco para o servidor estar pronto
    setTimeout(async () => {
      await testAPIs();
      
      // Encerrar após os testes
      setTimeout(() => {
        console.log('\n🔄 Encerrando servidor de teste...');
        if (pgClient) {
          pgClient.end();
        }
        if (server) {
          server.close();
        }
        console.log('✅ Teste concluído!');
        process.exit(0);
      }, 2000);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro durante inicialização:', error);
    process.exit(1);
  }
}

// Executar teste
main();
