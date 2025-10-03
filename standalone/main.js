const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Configuração do banco de dados local
const Database = require('sqlite3').Database;
let db;

// Janela principal
let mainWindow;

// Configuração do banco PostgreSQL (para quando disponível)
const pgConfig = {
  host: '35.199.101.38',
  port: 5432,
  database: 'liberdade-medica',
  user: 'vinilean',
  password: '-Infra55LM-',
  ssl: { rejectUnauthorized: false }
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
  });
}

// Inicializar banco de dados local
function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'artigos.db');
  
  db = new Database(dbPath, (err) => {
    if (err) {
      console.error('Erro ao abrir banco local:', err);
      return;
    }
    
    console.log('✅ Banco de dados local conectado');
    
    // Criar tabela se não existir
    db.run(`
      CREATE TABLE IF NOT EXISTS artigos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        categoria TEXT NOT NULL,
        autor TEXT NOT NULL,
        data_criacao TEXT NOT NULL,
        data_atualizacao TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'publicado',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Erro ao criar tabela:', err);
      } else {
        console.log('✅ Tabela artigos pronta');
      }
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

// Função para garantir slug único
function ensureUniqueSlug(baseSlug, excludeId = null) {
  return new Promise((resolve) => {
    let slug = baseSlug;
    let counter = 1;
    
    function checkSlug() {
      const query = excludeId 
        ? 'SELECT id FROM artigos WHERE slug = ? AND id != ?'
        : 'SELECT id FROM artigos WHERE slug = ?';
      const params = excludeId ? [slug, excludeId] : [slug];
      
      db.get(query, params, (err, row) => {
        if (err) {
          console.error('Erro ao verificar slug:', err);
          resolve(baseSlug);
          return;
        }
        
        if (!row) {
          resolve(slug);
        } else {
          slug = `${baseSlug}_${counter}`;
          counter++;
          checkSlug();
        }
      });
    }
    
    checkSlug();
  });
}

// IPC Handlers

// Testar conexão
ipcMain.handle('test-connection', async () => {
  // Sempre retorna sucesso para modo local
  return {
    success: true,
    message: '✅ Modo desktop ativo - dados salvos localmente',
    mode: 'desktop'
  };
});

// Listar artigos
ipcMain.handle('list-articles', async () => {
  return new Promise((resolve) => {
    db.all(`
      SELECT id, titulo, categoria, autor, data_criacao, status, slug
      FROM artigos 
      ORDER BY created_at DESC 
      LIMIT 20
    `, (err, rows) => {
      if (err) {
        console.error('Erro ao listar artigos:', err);
        resolve({ success: false, message: err.message, articles: [] });
      } else {
        resolve({ success: true, articles: rows, mode: 'desktop' });
      }
    });
  });
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
    const finalSlug = await ensureUniqueSlug(slug);
    const now = new Date();

    return new Promise((resolve) => {
      const query = `
        INSERT INTO artigos 
        (titulo, slug, categoria, autor, data_criacao, data_atualizacao, content, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

      db.run(query, values, function(err) {
        if (err) {
          console.error('Erro ao criar artigo:', err);
          resolve({ success: false, message: err.message });
        } else {
          resolve({
            success: true,
            id: this.lastID,
            slug: finalSlug,
            message: 'Artigo salvo com sucesso!',
            mode: 'desktop'
          });
        }
      });
    });
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
      fs.writeFileSync(result.filePath, JSON.stringify(draftData, null, 2));
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
    return { success: false, message: error.message };
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

// Eventos do app
app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (db) {
      db.close();
    }
    app.quit();
  }
});

app.on('before-quit', () => {
  if (db) {
    db.close();
  }
});
