// Verificar se estamos no contexto do Electron
const isElectron = typeof require !== 'undefined' && require('electron');
const ipcRenderer = isElectron ? require('electron').ipcRenderer : null;

class EditorArtigosDesktop {
    constructor() {
        this.blocos = [];
        this.serverPort = 3001; // Porta padrão, será atualizada
        this.baseURL = `http://localhost:${this.serverPort}`;
        this.init();
    }

    async init() {
        this.bindElements();
        this.bindEvents();
        
        // Obter porta do servidor se estivermos no Electron
        if (ipcRenderer) {
            try {
                this.serverPort = await ipcRenderer.invoke('get-server-port');
                this.baseURL = `http://localhost:${this.serverPort}`;
            } catch (error) {
                console.log('Usando porta padrão 3001');
            }
        }
        
        await this.checkHealth();
        await this.loadArticles();
    }

    bindElements() {
        // Elementos do formulário
        this.tituloInput = document.getElementById('titulo');
        this.categoriaSelect = document.getElementById('categoria');
        this.autorInput = document.getElementById('autor');
        this.conteudoTextarea = document.getElementById('conteudo');
        this.tipoSelect = document.getElementById('tipo');
        
        // Elementos de interface
        this.statusDiv = document.getElementById('status');
        this.blocksListDiv = document.getElementById('blocksList');
        this.previewDiv = document.getElementById('preview');
        this.articlesListDiv = document.getElementById('articlesList');
        
        // Botões
        this.addBlockBtn = document.getElementById('addBlock');
        this.saveDraftBtn = document.getElementById('saveDraft');
        this.loadDraftBtn = document.getElementById('loadDraft');
        this.exportHtmlBtn = document.getElementById('exportHtml');
        this.clearFormBtn = document.getElementById('clearForm');
        this.publishBtn = document.getElementById('publishArticle');
    }

    bindEvents() {
        // Eventos dos botões
        this.addBlockBtn.addEventListener('click', () => this.addBlock());
        this.saveDraftBtn.addEventListener('click', () => this.saveDraft());
        this.loadDraftBtn.addEventListener('click', () => this.loadDraft());
        this.exportHtmlBtn.addEventListener('click', () => this.exportHtml());
        this.clearFormBtn.addEventListener('click', () => this.clearForm());
        this.publishBtn.addEventListener('click', () => this.publishArticle());
        
        // Eventos de input para atualizar preview
        this.tituloInput.addEventListener('input', () => this.updatePreview());
        this.categoriaSelect.addEventListener('change', () => this.updatePreview());
        this.autorInput.addEventListener('input', () => this.updatePreview());
        
        // Atalho Ctrl+Enter para adicionar bloco
        this.conteudoTextarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.addBlock();
            }
        });

        // Auto-focus no primeiro campo
        this.tituloInput.focus();
    }

    // Verificar status da aplicação
    async checkHealth() {
        try {
            // Tentar usar API HTTP primeiro
            const response = await fetch(`${this.baseURL}/api/test-connection`);
            const result = await response.json();
            
            if (result.success) {
                this.setStatus(result.message, result.mode === 'postgresql' ? 'success' : 'warning');
                this.updateConnectionIndicator(result.mode, result.message);
            } else {
                this.setStatus('❌ Erro na conexão com o banco', 'error');
                this.updateConnectionIndicator('error', 'Erro na conexão com o banco');
            }
        } catch (error) {
            // Fallback para IPC se estivermos no Electron
            if (ipcRenderer) {
                try {
                    const result = await ipcRenderer.invoke('test-connection');
                    
                    if (result.success) {
                        this.setStatus(result.message, result.mode === 'postgresql' ? 'success' : 'warning');
                        this.updateConnectionIndicator(result.mode, result.message);
                    } else {
                        this.setStatus('❌ Erro na aplicação', 'error');
                        this.updateConnectionIndicator('error', 'Erro na aplicação');
                    }
                } catch (ipcError) {
                    this.setStatus('❌ Erro de comunicação', 'error');
                    this.updateConnectionIndicator('error', 'Erro de comunicação');
                    console.error('Erro ao verificar health via IPC:', ipcError);
                }
            } else {
                this.setStatus('❌ Servidor não disponível', 'error');
                this.updateConnectionIndicator('error', 'Servidor não disponível');
                console.error('Erro ao verificar health via HTTP:', error);
            }
        }
    }

    // Atualizar indicador de conexão
    updateConnectionIndicator(mode, message) {
        // Criar indicador se não existir
        let indicator = document.getElementById('connectionIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'connectionIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 15px;
                border-radius: 25px;
                font-size: 12px;
                font-weight: bold;
                color: white;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            document.body.appendChild(indicator);
            
            // Clique para recarregar status
            indicator.addEventListener('click', () => this.checkHealth());
        }
        
        // Atualizar cor e texto baseado no modo
        switch (mode) {
            case 'postgresql':
                indicator.style.backgroundColor = '#10b981'; // Verde
                indicator.textContent = '🟢 PostgreSQL';
                indicator.title = message;
                break;
            case 'offline':
                indicator.style.backgroundColor = '#f59e0b'; // Amarelo
                indicator.textContent = '🟡 Offline';
                indicator.title = message;
                break;
            case 'error':
                indicator.style.backgroundColor = '#ef4444'; // Vermelho
                indicator.textContent = '🔴 Erro';
                indicator.title = message;
                break;
            default:
                indicator.style.backgroundColor = '#6b7280'; // Cinza
                indicator.textContent = '⚪ Desconhecido';
                indicator.title = message;
        }
    }

    // Carregar lista de artigos
    async loadArticles() {
        try {
            const response = await fetch(`${this.baseURL}/api/articles`);
            const result = await response.json();
            
            if (result.success && result.articles) {
                this.displayArticles(result.articles);
            } else {
                this.articlesListDiv.innerHTML = '<p class="text-gray-500">Nenhum artigo encontrado</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar artigos:', error);
            this.articlesListDiv.innerHTML = '<p class="text-red-500">Erro ao carregar artigos</p>';
        }
    }

    // Exibir lista de artigos
    displayArticles(articles) {
        if (!articles || articles.length === 0) {
            this.articlesListDiv.innerHTML = '<p class="text-gray-500">Nenhum artigo encontrado</p>';
            return;
        }

        const articlesHtml = articles.map(article => `
            <div class="article-item bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <h4 class="font-semibold text-gray-800 mb-2">${this.escapeHtml(article.titulo)}</h4>
                <div class="text-sm text-gray-600 mb-2">
                    <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">${this.escapeHtml(article.categoria)}</span>
                    <span>por ${this.escapeHtml(article.autor)}</span>
                </div>
                <div class="text-xs text-gray-500">
                    <span>ID: ${article.id}</span> | 
                    <span>Slug: ${this.escapeHtml(article.slug)}</span> | 
                    <span>Criado: ${new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>
        `).join('');

        this.articlesListDiv.innerHTML = `
            <h3 class="text-lg font-semibold mb-4 text-gray-800">Artigos Recentes (${articles.length})</h3>
            <div class="space-y-3">
                ${articlesHtml}
            </div>
        `;
    }

    // Adicionar bloco de conteúdo
    addBlock() {
        const tipo = this.tipoSelect.value;
        const conteudo = this.conteudoTextarea.value.trim();

        if (!conteudo) {
            this.setStatus('❌ Digite o conteúdo antes de adicionar o bloco', 'error');
            this.conteudoTextarea.focus();
            return;
        }

        const bloco = {
            id: Date.now(),
            tipo: tipo,
            conteudo: conteudo
        };

        this.blocos.push(bloco);
        this.conteudoTextarea.value = '';
        this.conteudoTextarea.focus();
        
        this.updateBlocksList();
        this.updatePreview();
        this.setStatus(`✅ Bloco ${tipo.toUpperCase()} adicionado`, 'success');
    }

    // Atualizar lista de blocos
    updateBlocksList() {
        if (this.blocos.length === 0) {
            this.blocksListDiv.innerHTML = '<p class="text-gray-500">Nenhum bloco adicionado</p>';
            return;
        }

        const blocksHtml = this.blocos.map((bloco, index) => `
            <div class="block-item bg-white p-3 rounded border border-gray-200 mb-2">
                <div class="flex justify-between items-start mb-2">
                    <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        ${bloco.tipo.toUpperCase()}
                    </span>
                    <div class="flex gap-2">
                        <button onclick="editor.moveBlock(${index}, -1)" class="text-blue-600 hover:text-blue-800 text-sm" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button onclick="editor.moveBlock(${index}, 1)" class="text-blue-600 hover:text-blue-800 text-sm" ${index === this.blocos.length - 1 ? 'disabled' : ''}>↓</button>
                        <button onclick="editor.editBlock(${index})" class="text-green-600 hover:text-green-800 text-sm">✏️</button>
                        <button onclick="editor.removeBlock(${index})" class="text-red-600 hover:text-red-800 text-sm">🗑️</button>
                    </div>
                </div>
                <div class="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    ${this.escapeHtml(bloco.conteudo.substring(0, 100))}${bloco.conteudo.length > 100 ? '...' : ''}
                </div>
            </div>
        `).join('');

        this.blocksListDiv.innerHTML = `
            <h3 class="text-lg font-semibold mb-3 text-gray-800">Blocos do Artigo (${this.blocos.length})</h3>
            ${blocksHtml}
        `;
    }

    // Mover bloco
    moveBlock(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.blocos.length) return;

        [this.blocos[index], this.blocos[newIndex]] = [this.blocos[newIndex], this.blocos[index]];
        this.updateBlocksList();
        this.updatePreview();
        this.setStatus('✅ Bloco movido', 'success');
    }

    // Editar bloco
    editBlock(index) {
        const bloco = this.blocos[index];
        this.tipoSelect.value = bloco.tipo;
        this.conteudoTextarea.value = bloco.conteudo;
        this.conteudoTextarea.focus();
        
        // Remover o bloco temporariamente
        this.blocos.splice(index, 1);
        this.updateBlocksList();
        this.updatePreview();
        this.setStatus('✏️ Bloco carregado para edição', 'info');
    }

    // Remover bloco
    removeBlock(index) {
        if (confirm('Tem certeza que deseja remover este bloco?')) {
            this.blocos.splice(index, 1);
            this.updateBlocksList();
            this.updatePreview();
            this.setStatus('🗑️ Bloco removido', 'success');
        }
    }

    // Atualizar preview
    updatePreview() {
        const titulo = this.tituloInput.value;
        const categoria = this.categoriaSelect.value;
        const autor = this.autorInput.value;

        let html = '';
        
        if (titulo) {
            html += `<h1 class="text-3xl font-bold mb-4 text-gray-800">${this.escapeHtml(titulo)}</h1>`;
        }
        
        if (categoria || autor) {
            html += '<div class="mb-6 text-sm text-gray-600">';
            if (categoria) {
                html += `<span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full mr-3">📂 ${this.escapeHtml(categoria)}</span>`;
            }
            if (autor) {
                html += `<span class="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full">✍️ ${this.escapeHtml(autor)}</span>`;
            }
            html += '</div>';
        }

        // Adicionar blocos
        this.blocos.forEach(bloco => {
            const conteudo = this.escapeHtml(bloco.conteudo);
            
            switch (bloco.tipo) {
                case 'h1':
                    html += `<h1 class="text-2xl font-bold mt-6 mb-3 text-gray-800">${conteudo}</h1>`;
                    break;
                case 'h2':
                    html += `<h2 class="text-xl font-bold mt-5 mb-3 text-gray-800">${conteudo}</h2>`;
                    break;
                case 'h3':
                    html += `<h3 class="text-lg font-bold mt-4 mb-2 text-gray-800">${conteudo}</h3>`;
                    break;
                case 'h4':
                    html += `<h4 class="text-base font-bold mt-3 mb-2 text-gray-800">${conteudo}</h4>`;
                    break;
                case 'h5':
                    html += `<h5 class="text-sm font-bold mt-3 mb-2 text-gray-800">${conteudo}</h5>`;
                    break;
                case 'h6':
                    html += `<h6 class="text-xs font-bold mt-2 mb-2 text-gray-800">${conteudo}</h6>`;
                    break;
                case 'p':
                default:
                    html += `<p class="mb-4 text-gray-700 leading-relaxed">${conteudo.replace(/\n/g, '<br>')}</p>`;
                    break;
            }
        });

        if (!html) {
            html = '<p class="text-gray-500 italic">Preview aparecerá aqui conforme você adiciona conteúdo...</p>';
        }

        this.previewDiv.innerHTML = html;
    }

    // Publicar artigo
    async publishArticle() {
        const titulo = this.tituloInput.value.trim();
        const categoria = this.categoriaSelect.value;
        const autor = this.autorInput.value.trim();

        // Validações
        if (!titulo) {
            this.setStatus('❌ Título é obrigatório', 'error');
            this.tituloInput.focus();
            return;
        }

        if (!categoria) {
            this.setStatus('❌ Categoria é obrigatória', 'error');
            this.categoriaSelect.focus();
            return;
        }

        if (!autor) {
            this.setStatus('❌ Autor é obrigatório', 'error');
            this.autorInput.focus();
            return;
        }

        if (this.blocos.length === 0) {
            this.setStatus('❌ Adicione pelo menos um bloco de conteúdo', 'error');
            this.conteudoTextarea.focus();
            return;
        }

        // Gerar HTML do conteúdo
        let contentHtml = '';
        this.blocos.forEach(bloco => {
            const conteudo = bloco.conteudo;
            
            switch (bloco.tipo) {
                case 'h1':
                    contentHtml += `<h1>${conteudo}</h1>\n`;
                    break;
                case 'h2':
                    contentHtml += `<h2>${conteudo}</h2>\n`;
                    break;
                case 'h3':
                    contentHtml += `<h3>${conteudo}</h3>\n`;
                    break;
                case 'h4':
                    contentHtml += `<h4>${conteudo}</h4>\n`;
                    break;
                case 'h5':
                    contentHtml += `<h5>${conteudo}</h5>\n`;
                    break;
                case 'h6':
                    contentHtml += `<h6>${conteudo}</h6>\n`;
                    break;
                case 'p':
                default:
                    contentHtml += `<p>${conteudo.replace(/\n/g, '<br>')}</p>\n`;
                    break;
            }
        });

        // Dados do artigo
        const articleData = {
            titulo: titulo,
            categoria: categoria,
            autor: autor,
            content: contentHtml
        };

        try {
            this.setStatus('🔄 Publicando artigo...', 'info');
            this.publishBtn.disabled = true;

            const response = await fetch(`${this.baseURL}/api/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(articleData)
            });

            const result = await response.json();

            if (result.success) {
                this.setStatus(result.message, 'success');
                
                // Limpar formulário após sucesso
                setTimeout(() => {
                    this.clearForm();
                    this.loadArticles(); // Recarregar lista de artigos
                }, 2000);
            } else {
                this.setStatus('❌ ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao publicar artigo:', error);
            this.setStatus('❌ Erro ao publicar artigo: ' + error.message, 'error');
        } finally {
            this.publishBtn.disabled = false;
        }
    }

    // Salvar rascunho
    async saveDraft() {
        const draftData = {
            titulo: this.tituloInput.value,
            categoria: this.categoriaSelect.value,
            autor: this.autorInput.value,
            blocos: this.blocos
        };

        if (ipcRenderer) {
            try {
                const result = await ipcRenderer.invoke('save-draft', draftData);
                this.setStatus(result.success ? result.message : '❌ ' + result.message, 
                             result.success ? 'success' : 'error');
            } catch (error) {
                this.setStatus('❌ Erro ao salvar rascunho: ' + error.message, 'error');
            }
        } else {
            // Fallback para download do arquivo
            const blob = new Blob([JSON.stringify(draftData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rascunho-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.setStatus('✅ Rascunho baixado', 'success');
        }
    }

    // Carregar rascunho
    async loadDraft() {
        if (ipcRenderer) {
            try {
                const result = await ipcRenderer.invoke('load-draft');
                
                if (result.success) {
                    this.loadDraftData(result.data);
                    this.setStatus('✅ Rascunho carregado', 'success');
                } else {
                    this.setStatus(result.message, 'info');
                }
            } catch (error) {
                this.setStatus('❌ Erro ao carregar rascunho: ' + error.message, 'error');
            }
        } else {
            // Fallback para input file
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const data = JSON.parse(e.target.result);
                            this.loadDraftData(data);
                            this.setStatus('✅ Rascunho carregado', 'success');
                        } catch (error) {
                            this.setStatus('❌ Erro ao ler arquivo: ' + error.message, 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }
    }

    // Carregar dados do rascunho
    loadDraftData(data) {
        this.tituloInput.value = data.titulo || '';
        this.categoriaSelect.value = data.categoria || '';
        this.autorInput.value = data.autor || '';
        this.blocos = data.blocos || [];
        
        this.updateBlocksList();
        this.updatePreview();
    }

    // Exportar HTML
    async exportHtml() {
        const titulo = this.tituloInput.value || 'Artigo';
        const categoria = this.categoriaSelect.value;
        const autor = this.autorInput.value;

        let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(titulo)}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3, h4, h5, h6 { color: #333; margin-top: 1.5em; margin-bottom: 0.5em; }
        p { margin-bottom: 1em; }
        .meta { color: #666; font-size: 0.9em; margin-bottom: 2em; }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(titulo)}</h1>
    <div class="meta">`;

        if (categoria) html += `Categoria: ${this.escapeHtml(categoria)} | `;
        if (autor) html += `Autor: ${this.escapeHtml(autor)} | `;
        html += `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`;
        html += `</div>`;

        // Adicionar blocos
        this.blocos.forEach(bloco => {
            const conteudo = this.escapeHtml(bloco.conteudo);
            
            switch (bloco.tipo) {
                case 'h1':
                    html += `    <h1>${conteudo}</h1>\n`;
                    break;
                case 'h2':
                    html += `    <h2>${conteudo}</h2>\n`;
                    break;
                case 'h3':
                    html += `    <h3>${conteudo}</h3>\n`;
                    break;
                case 'h4':
                    html += `    <h4>${conteudo}</h4>\n`;
                    break;
                case 'h5':
                    html += `    <h5>${conteudo}</h5>\n`;
                    break;
                case 'h6':
                    html += `    <h6>${conteudo}</h6>\n`;
                    break;
                case 'p':
                default:
                    html += `    <p>${conteudo.replace(/\n/g, '<br>')}</p>\n`;
                    break;
            }
        });

        html += `</body>
</html>`;

        const htmlData = {
            titulo: titulo,
            content: html
        };

        if (ipcRenderer) {
            try {
                const result = await ipcRenderer.invoke('export-html', htmlData);
                this.setStatus(result.success ? result.message : '❌ ' + result.message, 
                             result.success ? 'success' : 'error');
            } catch (error) {
                this.setStatus('❌ Erro ao exportar HTML: ' + error.message, 'error');
            }
        } else {
            // Fallback para download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
            a.click();
            URL.revokeObjectURL(url);
            this.setStatus('✅ HTML exportado', 'success');
        }
    }

    // Limpar formulário
    clearForm() {
        if (confirm('Tem certeza que deseja limpar o formulário? Todos os dados não salvos serão perdidos.')) {
            this.tituloInput.value = '';
            this.categoriaSelect.value = '';
            this.autorInput.value = '';
            this.conteudoTextarea.value = '';
            this.blocos = [];
            
            this.updateBlocksList();
            this.updatePreview();
            this.setStatus('🧹 Formulário limpo', 'success');
            this.tituloInput.focus();
        }
    }

    // Definir status
    setStatus(message, type = 'info') {
        if (!this.statusDiv) return;

        const colors = {
            success: 'bg-green-100 text-green-800 border-green-200',
            error: 'bg-red-100 text-red-800 border-red-200',
            warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            info: 'bg-blue-100 text-blue-800 border-blue-200'
        };

        this.statusDiv.className = `p-3 rounded-lg border ${colors[type] || colors.info}`;
        this.statusDiv.textContent = message;
        this.statusDiv.style.display = 'block';

        // Auto-hide após 5 segundos para mensagens de sucesso
        if (type === 'success') {
            setTimeout(() => {
                if (this.statusDiv) {
                    this.statusDiv.style.display = 'none';
                }
            }, 5000);
        }
    }

    // Escapar HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar aplicação
const editor = new EditorArtigosDesktop();

// Expor globalmente para uso nos botões inline
window.editor = editor;
