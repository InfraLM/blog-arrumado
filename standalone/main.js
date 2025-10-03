const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Janela principal
let mainWindow;

// Arquivo de dados local (fallback)
let dataFile;

// Cliente PostgreSQL
let pgClient = null;
let connectionStatus = 'disconnected';

// Configuração do banco PostgreSQL
const dbConfig = {
  host: '35.199.101.38',
  port: 5432,
  database: 'liberdade-medica',
  user: 'vinilean',
  password: '-Infra55LM-',
  ssl: false,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  statement_timeout: 10000,
  idle_in_transaction_session_timeout: 10000
};

function createWindow() {
  // Criar janela principal
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Editor de Artigos - Blog Liberdade Médica',
    show: false
  });

  // Carregar a interface
  mainWindow.loadFile('index.html');

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

  // Evento de fechar
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (pgClient) {
      pgClient.end();
    }
  });
}

// Inicializar conexão PostgreSQL
async function initPostgreSQL() {
  try {
    const { Client } = require('pg');
    pgClient = new Client(dbConfig);
    
    console.log('🔄 Tentando conectar ao PostgreSQL...');
    await pgClient.connect();
    
    // Testar conexão
    const result = await pgClient.query('SELECT NOW() as current_time');
    console.log('✅ PostgreSQL conectado:', result.rows[0].current_time);
    
    connectionStatus = 'connected';
    return true;
  } catch (error) {
    console.log('❌ Erro ao conectar PostgreSQL:', error.message);
    console.log('📁 Usando modo offline (JSON local)');
    connectionStatus = 'offline';
    pgClient = null;
    return false;
  }
}

// Inicializar arquivo de dados local (fallback)
function initDataFile() {
  const userDataPath = app.getPath('userData');
  dataFile = path.join(userDataPath, 'artigos.json');
  
  // Criar arquivo se não existir
  if (!fs.existsSync(dataFile)) {
    const initialData = {
      artigos: [],
      lastId: 0,
      created: new Date().toISOString()
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
    console.log('✅ Arquivo de dados local criado:', dataFile);
  } else {
    console.log('✅ Arquivo de dados local encontrado:', dataFile);
  }
}

// Ler dados do arquivo local
function readLocalData() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler dados locais:', error);
    return { artigos: [], lastId: 0 };
  }
}

// Salvar dados no arquivo local
function saveLocalData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados locais:', error);
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

// Função para garantir slug único (PostgreSQL)
async function ensureUniqueSlugPG(baseSlug, excludeId = null) {
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

// Função para garantir slug único (Local)
function ensureUniqueSlugLocal(baseSlug, excludeId = null) {
  const data = readLocalData();
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const exists = data.artigos.find(article => 
      article.slug === slug && article.id !== excludeId
    );
    
    if (!exists) {
      return slug;
    }
    
    slug = `${baseSlug}_${counter}`;
    counter++;
  }
}

// IPC Handlers

// Testar conexão
ipcMain.handle('test-connection', async () => {
  if (connectionStatus === 'connected') {
    try {
      await pgClient.query('SELECT 1');
      return {
        success: true,
        message: '✅ PostgreSQL conectado - dados salvos no banco',
        mode: 'postgresql',
        status: 'connected'
      };
    } catch (error) {
      connectionStatus = 'offline';
      return {
        success: true,
        message: '⚠️ PostgreSQL desconectado - usando modo offline',
        mode: 'local',
        status: 'offline'
      };
    }
  } else {
    return {
      success: true,
      message: '📁 Modo offline ativo - dados salvos localmente',
      mode: 'local',
      status: 'offline'
    };
  }
});

// Listar artigos
ipcMain.handle('list-articles', async () => {
  try {
    if (pgClient && connectionStatus === 'connected') {
      // Tentar buscar do PostgreSQL
      try {
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
          slug: row.slug
        }));
        
        return { 
          success: true, 
          articles: articles, 
          mode: 'postgresql',
          total: result.rows.length
        };
      } catch (error) {
        console.error('Erro ao buscar artigos PostgreSQL:', error);
        connectionStatus = 'offline';
      }
    }
    
    // Fallback para dados locais
    const data = readLocalData();
    const articles = data.artigos
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20)
      .map(article => ({
        id: article.id,
        titulo: article.titulo,
        categoria: article.categoria,
        autor: article.autor,
        data_criacao: article.data_criacao,
        status: article.status,
        slug: article.slug
      }));
    
    return { 
      success: true, 
      articles: articles, 
      mode: 'local',
      total: data.artigos.length
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.message, 
      articles: [] 
    };
  }
});

// Criar artigo
ipcMain.handle('create-article', async (event, articleData) => {
  const { titulo, categoria, autor, content } = articleData;
  
  // Validação
  if (!titulo || !categoria || !autor || !content) {
    return { success: false, message: 'Todos os campos são obrigatórios' };
  }

  try {
    const slug = generateSlug(titulo);
    const now = new Date();
    
    // Tentar salvar no PostgreSQL primeiro
    if (pgClient && connectionStatus === 'connected') {
      try {
        const finalSlug = await ensureUniqueSlugPG(slug);
        
        const insertQuery = `
          INSERT INTO public.blog_artigos 
          (titulo, slug, categoria, autor, data_criacao, data_atualizacao, content, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
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
          now.toISOString(),
          now.toISOString()
        ];
        
        const result = await pgClient.query(insertQuery, values);
        
        console.log('✅ Artigo salvo no PostgreSQL:', result.rows[0].id);
        
        return {
          success: true,
          id: result.rows[0].id,
          slug: finalSlug,
          message: '✅ Artigo publicado no blog com sucesso!',
          mode: 'postgresql'
        };
      } catch (error) {
        console.error('Erro ao salvar no PostgreSQL:', error);
        connectionStatus = 'offline';
        // Continuar para salvar localmente
      }
    }
    
    // Fallback para dados locais
    const data = readLocalData();
    const finalSlug = ensureUniqueSlugLocal(slug);
    
    const newArticle = {
      id: data.lastId + 1,
      titulo: titulo,
      slug: finalSlug,
      categoria: categoria,
      autor: autor,
      data_criacao: now.toISOString().split('T')[0],
      data_atualizacao: now.toISOString().split('T')[0],
      content: content,
      status: 'publicado',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    
    data.artigos.push(newArticle);
    data.lastId = newArticle.id;
    
    if (saveLocalData(data)) {
      console.log('📁 Artigo salvo localmente:', newArticle.id);
      return {
        success: true,
        id: newArticle.id,
        slug: finalSlug,
        message: '📁 Artigo salvo localmente (modo offline)',
        mode: 'local'
      };
    } else {
      return { success: false, message: 'Erro ao salvar dados' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Salvar rascunho
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

// Carregar rascunho
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

// Exportar HTML
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

// Backup dos dados
ipcMain.handle('backup-data', async () => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Backup dos Artigos',
      defaultPath: `backup-artigos-${new Date().toISOString().split('T')[0]}.json`,
      filters: [
        { name: 'Arquivos JSON', extensions: ['json'] }
      ]
    });

    if (!result.canceled) {
      let data;
      
      if (pgClient && connectionStatus === 'connected') {
        // Backup do PostgreSQL
        try {
          const result = await pgClient.query('SELECT * FROM public.blog_artigos ORDER BY created_at DESC');
          data = {
            source: 'postgresql',
            timestamp: new Date().toISOString(),
            artigos: result.rows
          };
        } catch (error) {
          data = readLocalData();
          data.source = 'local';
        }
      } else {
        // Backup local
        data = readLocalData();
        data.source = 'local';
      }
      
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, message: 'Backup criado com sucesso!' };
    }
    
    return { success: false, message: 'Backup cancelado' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Eventos do app
app.whenReady().then(async () => {
  initDataFile();
  await initPostgreSQL();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (pgClient) {
    pgClient.end();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Log de inicialização
console.log('========================================');
console.log(' EDITOR DE ARTIGOS - DESKTOP');
console.log(' Blog Liberdade Médica');
console.log(' Versão com PostgreSQL + Fallback');
console.log('========================================');
console.log('✅ Aplicativo iniciado');
console.log('📁 Dados locais em:', app.getPath('userData'));
console.log('🔗 PostgreSQL:', dbConfig.host + ':' + dbConfig.port);
console.log('========================================');
