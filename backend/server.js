const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Configuração do servidor
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Configuração do banco de dados PostgreSQL
const dbConfig = {
  host: process.env.DB_HOST || '35.199.101.38',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'liberdade-medica',
  user: process.env.DB_USER || 'vinilean',
  password: process.env.DB_PASSWORD || '-Infra55LM-',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : { rejectUnauthorized: false }
};

// Tentar carregar PostgreSQL
let Client = null;
let pgAvailable = false;

try {
  const { Client: PgClient } = require('pg');
  Client = PgClient;
  pgAvailable = true;
  console.log('✅ PostgreSQL disponível');
} catch (error) {
  console.log('⚠️  PostgreSQL não disponível, usando modo local');
  pgAvailable = false;
}

// Arquivo para modo local
const LOCAL_DB_FILE = path.join(__dirname, '../data/artigos.json');

// Garantir que o diretório data existe
const dataDir = path.dirname(LOCAL_DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Funções utilitárias
function generateSlug(titulo) {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function readLocalArticles() {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const data = fs.readFileSync(LOCAL_DB_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler artigos locais:', error);
    return [];
  }
}

function saveLocalArticles(articles) {
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(articles, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar artigos locais:', error);
    return false;
  }
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  if (pgAvailable) {
    try {
      const client = new Client(dbConfig);
      await client.connect();
      
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const query = excludeId 
          ? 'SELECT id FROM public.blog_artigos WHERE slug = $1 AND id != $2'
          : 'SELECT id FROM public.blog_artigos WHERE slug = $1';
        const params = excludeId ? [slug, excludeId] : [slug];
        
        const result = await client.query(query, params);
        if (result.rows.length === 0) {
          await client.end();
          return slug;
        }
        slug = `${baseSlug}_${counter}`;
        counter++;
      }
    } catch (error) {
      console.error('Erro ao verificar slug único:', error);
      return baseSlug;
    }
  } else {
    // Modo local
    const articles = readLocalArticles();
    let slug = baseSlug;
    let counter = 1;
    
    while (articles.some(art => art.slug === slug && art.id !== excludeId)) {
      slug = `${baseSlug}_${counter}`;
      counter++;
    }
    
    return slug;
  }
}

// Rotas da API

// Rota principal - servir o frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Testar conexão
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'disconnected',
    mode: 'local'
  };

  if (pgAvailable) {
    try {
      const client = new Client(dbConfig);
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      health.database = 'connected';
      health.mode = 'postgresql';
    } catch (error) {
      health.database = 'error';
      health.error = error.message;
    }
  }

  res.json(health);
});

// Listar artigos
app.get('/api/articles', async (req, res) => {
  try {
    if (pgAvailable) {
      const client = new Client(dbConfig);
      await client.connect();
      
      const result = await client.query(`
        SELECT id, titulo, categoria, autor, data_criacao, status, slug
        FROM public.blog_artigos 
        ORDER BY created_at DESC 
        LIMIT 20
      `);
      
      await client.end();
      res.json({ success: true, articles: result.rows, mode: 'postgresql' });
    } else {
      const articles = readLocalArticles();
      const recentArticles = articles
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20)
        .map(art => ({
          id: art.id,
          titulo: art.titulo,
          categoria: art.categoria,
          autor: art.autor,
          data_criacao: art.data_criacao,
          status: art.status,
          slug: art.slug
        }));
      
      res.json({ success: true, articles: recentArticles, mode: 'local' });
    }
  } catch (error) {
    console.error('Erro ao listar artigos:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Criar artigo
app.post('/api/articles', async (req, res) => {
  try {
    const { titulo, categoria, autor, content } = req.body;
    
    // Validação
    if (!titulo || !categoria || !autor || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }

    const slug = generateSlug(titulo);
    const finalSlug = await ensureUniqueSlug(slug);
    const now = new Date();

    if (pgAvailable) {
      try {
        const client = new Client(dbConfig);
        await client.connect();
        
        const query = `
          INSERT INTO public.blog_artigos 
          (titulo, slug, categoria, autor, data_criacao, data_atualizacao, content, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id, slug
        `;
        
        const values = [
          titulo,
          finalSlug,
          categoria,
          autor,
          now.toISOString().split('T')[0],
          now.toISOString().split('T')[0],
          content,
          'publicado',
          now,
          now
        ];

        const result = await client.query(query, values);
        await client.end();

        res.json({
          success: true,
          id: result.rows[0].id,
          slug: result.rows[0].slug,
          message: 'Artigo publicado no PostgreSQL com sucesso!',
          mode: 'postgresql'
        });
      } catch (dbError) {
        console.error('Erro PostgreSQL, salvando localmente:', dbError);
        // Fallback para modo local
        const articles = readLocalArticles();
        const newArticle = {
          id: Date.now(),
          titulo,
          slug: finalSlug,
          categoria,
          autor,
          data_criacao: now.toISOString().split('T')[0],
          data_atualizacao: now.toISOString().split('T')[0],
          content,
          status: 'publicado',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        };

        articles.push(newArticle);
        
        if (saveLocalArticles(articles)) {
          res.json({
            success: true,
            id: newArticle.id,
            slug: finalSlug,
            message: 'Artigo salvo localmente (PostgreSQL indisponível)',
            mode: 'local_fallback'
          });
        } else {
          throw new Error('Erro ao salvar artigo localmente');
        }
      }
    } else {
      // Modo local
      const articles = readLocalArticles();
      const newArticle = {
        id: Date.now(),
        titulo,
        slug: finalSlug,
        categoria,
        autor,
        data_criacao: now.toISOString().split('T')[0],
        data_atualizacao: now.toISOString().split('T')[0],
        content,
        status: 'publicado',
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      articles.push(newArticle);
      
      if (saveLocalArticles(articles)) {
        res.json({
          success: true,
          id: newArticle.id,
          slug: finalSlug,
          message: 'Artigo salvo localmente com sucesso!',
          mode: 'local'
        });
      } else {
        throw new Error('Erro ao salvar artigo localmente');
      }
    }
  } catch (error) {
    console.error('Erro ao criar artigo:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro no servidor:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log('========================================');
  console.log(' EDITOR DE ARTIGOS - BLOG LIBERDADE MÉDICA');
  console.log(' Versão Arrumada - Backend + Frontend');
  console.log('========================================');
  console.log('');
  console.log(`🚀 Servidor iniciado na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log(`💾 Modo: ${pgAvailable ? 'PostgreSQL + Local Fallback' : 'Apenas Local'}`);
  console.log(`📁 Dados locais: ${LOCAL_DB_FILE}`);
  console.log('');
  console.log('Para parar o servidor, pressione Ctrl+C');
  console.log('========================================');

  // Tentar abrir navegador automaticamente
  if (process.argv.includes('--open')) {
    try {
      const open = require('open');
      setTimeout(() => {
        open(`http://localhost:${PORT}`);
      }, 1000);
    } catch (error) {
      console.log('Para abrir: http://localhost:3000');
    }
  }
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nRecebido SIGINT, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});

module.exports = app;
