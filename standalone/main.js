const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const AWS = require('aws-sdk');
const multer = require('multer');
const crypto = require('crypto');

// Variáveis globais
let mainWindow;
let serverApp;
let server;
let pgClient = null;
let serverPort = 3001;
let serverReady = false;

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

// Configuração do Backblaze B2
const b2Config = {
  accessKeyId: '005130cedd268650000000004',
  secretAccessKey: 'K005h8RBjbhsVX5NieckVPQ0ZKGHSAc',
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  bucket: 'imagensblog'
};

// Configurar AWS SDK para Backblaze B2
const s3 = new AWS.S3({
  accessKeyId: b2Config.accessKeyId,
  secretAccessKey: b2Config.secretAccessKey,
  endpoint: b2Config.endpoint,
  region: b2Config.region,
  s3ForcePathStyle: true
});

// Configurar multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Aceitar apenas imagens
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos'), false);
    }
  }
});

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
    
    // Conectar ao PostgreSQL
    initPostgreSQL();
    
    // Configurar rotas da API
    setupRoutes();
    
    // Encontrar porta disponível
    findAvailablePort(3001, (port) => {
      serverPort = port;
      server = serverApp.listen(port, 'localhost', () => {
        console.log(`✅ Servidor backend iniciado na porta ${port}`);
        serverReady = true;
        resolve(port);
      });
      
      server.on('error', (err) => {
        console.error('❌ Erro no servidor:', err);
        reject(err);
      });
    });
  });
}

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
      
      // Verificar estrutura da tabela
      const columnsCheck = await pgClient.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_artigos'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Colunas da tabela:', columnsCheck.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    } else {
      console.log('⚠️ Tabela blog_artigos não encontrada');
    }
    
    // Configurar handlers de erro para a conexão
    pgClient.on('error', (err) => {
      console.error('❌ Erro na conexão PostgreSQL:', err.message);
    });
    
    pgClient.on('end', () => {
      console.log('🔌 Conexão PostgreSQL encerrada');
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar PostgreSQL:', error.message);
    console.error('🔍 Detalhes:', {
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    });
    pgClient = null;
    return false;
  }
}

// Função para fazer upload de imagem para Backblaze B2
async function uploadImageToB2(file, filename) {
  try {
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = filename || `${crypto.randomUUID()}${fileExtension}`;
    
    const uploadParams = {
      Bucket: b2Config.bucket,
      Key: uniqueFilename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    console.log('🔄 Fazendo upload para Backblaze B2:', uniqueFilename);
    
    const result = await s3.upload(uploadParams).promise();
    
    // Construir URL pública
    const publicUrl = `https://${b2Config.bucket}.s3.us-east-005.backblazeb2.com/${uniqueFilename}`;
    
    console.log('✅ Upload concluído:', publicUrl);
    
    return {
      success: true,
      url: publicUrl,
      key: uniqueFilename,
      size: file.size,
      mimetype: file.mimetype
    };
  } catch (error) {
    console.error('❌ Erro no upload para B2:', error);
    throw error;
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

  // Upload de imagem
  serverApp.post('/api/upload-image', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Nenhuma imagem foi enviada'
        });
      }

      console.log('📷 Nova requisição de upload de imagem:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Fazer upload para Backblaze B2
      const uploadResult = await uploadImageToB2(req.file);

      res.json({
        success: true,
        message: '✅ Imagem enviada com sucesso!',
        image: uploadResult
      });

    } catch (error) {
      console.error('❌ Erro no upload de imagem:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao fazer upload da imagem: ' + error.message
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
        SELECT id, titulo, categoria, autor, coautor, resumo, destaque, 
               imagem_principal, data_criacao, status, slug, created_at
        FROM public.blog_artigos 
        ORDER BY created_at DESC 
        LIMIT 20
      `);

      const articles = result.rows.map(row => ({
        id: row.id,
        titulo: row.titulo,
        categoria: row.categoria,
        autor: row.autor,
        coautor: row.coautor,
        resumo: row.resumo,
        destaque: row.destaque,
        imagem_principal: row.imagem_principal,
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
      const { titulo, categoria, autor, coautor, resumo, destaque, imagem_principal, content } = req.body;

      console.log('📝 Nova requisição de criação de artigo:', {
        titulo: titulo ? titulo.substring(0, 50) + '...' : 'N/A',
        categoria: categoria || 'N/A',
        autor: autor || 'N/A',
        coautor: coautor || 'N/A',
        resumo: resumo ? resumo.substring(0, 50) + '...' : 'N/A',
        destaque: destaque || false,
        imagem_principal: imagem_principal ? 'Sim' : 'Não',
        content_length: content ? content.length : 0
      });

      // Validação detalhada
      const errors = [];
      if (!titulo || titulo.trim().length === 0) errors.push('Título é obrigatório');
      if (!categoria || categoria.trim().length === 0) errors.push('Categoria é obrigatória');
      if (!autor || autor.trim().length === 0) errors.push('Autor é obrigatório');
      if (!content || content.trim().length === 0) errors.push('Conteúdo é obrigatório');
      
      if (titulo && titulo.length > 255) errors.push('Título muito longo (máximo 255 caracteres)');
      if (categoria && categoria.length > 100) errors.push('Categoria muito longa (máximo 100 caracteres)');
      if (autor && autor.length > 100) errors.push('Nome do autor muito longo (máximo 100 caracteres)');
      if (coautor && coautor.length > 100) errors.push('Nome do co-autor muito longo (máximo 100 caracteres)');
      if (resumo && resumo.length > 500) errors.push('Resumo muito longo (máximo 500 caracteres)');

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

      // Testar conexão antes de inserir
      try {
        await pgClient.query('SELECT 1');
      } catch (connError) {
        console.error('❌ Erro na conexão PostgreSQL:', connError.message);
        return res.status(500).json({
          success: false,
          message: 'Erro na conexão com o banco de dados'
        });
      }

      const slug = generateSlug(titulo.trim());
      const finalSlug = await ensureUniqueSlug(slug);
      const now = new Date();

      console.log('🔄 Inserindo artigo no banco:', {
        titulo: titulo.trim(),
        slug: finalSlug,
        categoria: categoria.trim(),
        autor: autor.trim(),
        coautor: coautor ? coautor.trim() : null,
        destaque: destaque || false,
        imagem_principal: imagem_principal || null
      });

      const insertQuery = `
        INSERT INTO public.blog_artigos 
        (titulo, slug, categoria, autor, coautor, resumo, destaque, imagem_principal, 
         data_criacao, data_atualizacao, content, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, slug, titulo, categoria, autor, coautor, resumo, destaque, imagem_principal, created_at
      `;

      const values = [
        titulo.trim(),
        finalSlug,
        categoria.trim(),
        autor.trim(),
        coautor ? coautor.trim() : null,
        resumo ? resumo.trim() : null,
        destaque || false,
        imagem_principal || null,
        now.toISOString().split('T')[0], // data_criacao
        now.toISOString().split('T')[0], // data_atualizacao
        content.trim(),
        'publicado',
        now.toISOString(), // created_at
        now.toISOString()  // updated_at
      ];

      const result = await pgClient.query(insertQuery, values);
      const insertedArticle = result.rows[0];
      
      console.log('✅ Artigo inserido com sucesso no PostgreSQL:', {
        id: insertedArticle.id,
        slug: insertedArticle.slug,
        titulo: insertedArticle.titulo,
        categoria: insertedArticle.categoria,
        autor: insertedArticle.autor,
        coautor: insertedArticle.coautor,
        destaque: insertedArticle.destaque,
        imagem_principal: insertedArticle.imagem_principal,
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
          coautor: insertedArticle.coautor,
          resumo: insertedArticle.resumo,
          destaque: insertedArticle.destaque,
          imagem_principal: insertedArticle.imagem_principal,
          slug: insertedArticle.slug
        }
      });
    } catch (error) {
      console.error('❌ Erro ao criar artigo:', error.message);
      console.error('🔍 Stack trace:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao salvar artigo',
        error_details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
      });
    }
  });

  // Rota para servir o frontend
  serverApp.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  // Health check
  serverApp.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      postgresql: pgClient ? 'connected' : 'disconnected',
      port: serverPort,
      server_ready: serverReady
    });
  });
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

// Encontrar porta disponível
function findAvailablePort(startPort, callback) {
  const net = require('net');
  const server = net.createServer();
  
  server.listen(startPort, 'localhost', () => {
    const port = server.address().port;
    server.close(() => {
      callback(port);
    });
  });
  
  server.on('error', () => {
    findAvailablePort(startPort + 1, callback);
  });
}

// Criar janela do Electron
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: false,
      webSecurity: false // Permitir requisições para localhost
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Editor de Artigos - Blog Liberdade Médica',
    show: false,
    titleBarStyle: 'default'
  });

  // Carregar a aplicação web local
  mainWindow.loadURL(`http://localhost:${serverPort}`);

  // Mostrar quando pronto
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Maximizar se a tela for grande
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    
    if (width >= 1600 && height >= 900) {
      mainWindow.maximize();
    }
  });

  // Abrir DevTools em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Interceptar tentativas de navegação externa
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // Evento de fechar
  mainWindow.on('closed', () => {
    mainWindow = null;
    shutdownServer();
  });
}

// Encerrar servidor
function shutdownServer() {
  console.log('🔄 Encerrando servidor...');
  
  if (pgClient) {
    pgClient.end().then(() => {
      console.log('✅ Conexão PostgreSQL encerrada');
    }).catch(err => {
      console.error('❌ Erro ao encerrar PostgreSQL:', err);
    });
  }
  
  if (server) {
    server.close(() => {
      console.log('✅ Servidor backend encerrado');
    });
  }
}

// IPC Handlers para comunicação com o frontend
ipcMain.handle('test-connection', async () => {
  try {
    if (pgClient) {
      await pgClient.query('SELECT 1');
      return {
        success: true,
        message: '✅ PostgreSQL conectado - dados salvos no banco',
        mode: 'postgresql',
        status: 'connected',
        timestamp: new Date().toISOString(),
        server_port: serverPort
      };
    } else {
      return {
        success: false,
        message: '❌ PostgreSQL desconectado - modo offline',
        mode: 'offline',
        status: 'disconnected',
        timestamp: new Date().toISOString(),
        server_port: serverPort
      };
    }
  } catch (error) {
    console.error('Erro no teste de conexão IPC:', error);
    return {
      success: false,
      message: '❌ Erro na conexão: ' + error.message,
      mode: 'offline',
      status: 'error',
      timestamp: new Date().toISOString(),
      server_port: serverPort
    };
  }
});

ipcMain.handle('get-server-port', async () => {
  return serverPort;
});

ipcMain.handle('save-draft', async (event, draftData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Salvar Rascunho',
      defaultPath: `rascunho-${generateSlug(draftData.titulo || 'artigo')}.json`,
      filters: [
        { name: 'Arquivos JSON', extensions: ['json'] }
      ]
    });

    if (!result.canceled) {
      const draftWithTimestamp = {
        ...draftData,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      fs.writeFileSync(result.filePath, JSON.stringify(draftWithTimestamp, null, 2));
      return { success: true, message: 'Rascunho salvo com sucesso!' };
    }
    
    return { success: false, message: 'Salvamento cancelado' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('load-draft', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Carregar Rascunho',
      filters: [
        { name: 'Arquivos JSON', extensions: ['json'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const data = fs.readFileSync(result.filePaths[0], 'utf8');
      const draftData = JSON.parse(data);
      return { success: true, data: draftData };
    }
    
    return { success: false, message: 'Carregamento cancelado' };
  } catch (error) {
    return { success: false, message: 'Erro ao carregar rascunho: ' + error.message };
  }
});

ipcMain.handle('export-html', async (event, htmlData) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exportar HTML',
      defaultPath: `${generateSlug(htmlData.titulo || 'artigo')}.html`,
      filters: [
        { name: 'Arquivos HTML', extensions: ['html'] }
      ]
    });

    if (!result.canceled) {
      fs.writeFileSync(result.filePath, htmlData.content);
      return { success: true, message: 'HTML exportado com sucesso!' };
    }
    
    return { success: false, message: 'Exportação cancelada' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Eventos do app
app.whenReady().then(async () => {
  try {
    console.log('========================================');
    console.log(' EDITOR DE ARTIGOS - SERVIDOR INTEGRADO');
    console.log(' Blog Liberdade Médica');
    console.log('========================================');
    console.log('🚀 Iniciando servidor backend...');
    
    // Inicializar servidor primeiro
    await initServer();
    
    console.log('🖥️ Criando janela da aplicação...');
    
    // Aguardar um pouco para o servidor estar totalmente pronto
    setTimeout(() => {
      createWindow();
    }, 3000);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar aplicação:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  shutdownServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  shutdownServer();
});

// Log de inicialização
console.log('📱 Aplicativo iniciado');
console.log('🔗 PostgreSQL:', dbConfig.host + ':' + dbConfig.port);
console.log('📊 Database:', dbConfig.database);
console.log('========================================');
