const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Janela principal
let mainWindow;

// Arquivo de dados local
let dataFile;

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

// Inicializar arquivo de dados
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
    console.log('✅ Arquivo de dados criado:', dataFile);
  } else {
    console.log('✅ Arquivo de dados encontrado:', dataFile);
  }
}

// Ler dados do arquivo
function readData() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler dados:', error);
    return { artigos: [], lastId: 0 };
  }
}

// Salvar dados no arquivo
function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
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

// Função para garantir slug único
function ensureUniqueSlug(baseSlug, excludeId = null) {
  const data = readData();
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
  return {
    success: true,
    message: '✅ Aplicativo desktop ativo - dados salvos localmente',
    mode: 'desktop'
  };
});

// Listar artigos
ipcMain.handle('list-articles', async () => {
  try {
    const data = readData();
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
      mode: 'desktop',
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
    const data = readData();
    const slug = generateSlug(titulo);
    const finalSlug = ensureUniqueSlug(slug);
    const now = new Date();
    
    // Criar novo artigo
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
    
    // Adicionar ao array
    data.artigos.push(newArticle);
    data.lastId = newArticle.id;
    
    // Salvar
    if (saveData(data)) {
      return {
        success: true,
        id: newArticle.id,
        slug: finalSlug,
        message: 'Artigo salvo com sucesso!',
        mode: 'desktop'
      };
    } else {
      return { success: false, message: 'Erro ao salvar no arquivo' };
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
      const data = readData();
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true, message: 'Backup criado com sucesso!' };
    }
    
    return { success: false, message: 'Backup cancelado' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// Eventos do app
app.whenReady().then(() => {
  initDataFile();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Log de inicialização
console.log('========================================');
console.log(' EDITOR DE ARTIGOS - DESKTOP');
console.log(' Blog Liberdade Médica');
console.log('========================================');
console.log('✅ Aplicativo iniciado');
console.log('📁 Dados salvos em:', app.getPath('userData'));
console.log('========================================');
