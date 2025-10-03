// Editor de Artigos - Frontend Web com API Backend
// Versão: 1.1.0 - Servidor Integrado

class EditorArtigos {
    constructor() {
        this.blocks = [];
        this.apiUrl = 'http://localhost:3001/api';
        this.connectionStatus = 'checking';
        this.init();
    }

    init() {
        console.log('🚀 Iniciando Editor de Artigos - Versão Servidor Integrado');
        this.setupEventListeners();
        this.checkConnection();
        this.loadArticles();
        
        // Verificar conexão periodicamente
        setInterval(() => this.checkConnection(), 30000);
    }

    setupEventListeners() {
        // Botões principais
        document.getElementById('addBlock').addEventListener('click', () => this.addBlock());
        document.getElementById('publishArticle').addEventListener('click', () => this.publishArticle());
        document.getElementById('clearForm').addEventListener('click', () => this.clearForm());
        document.getElementById('saveDraft').addEventListener('click', () => this.saveDraft());
        document.getElementById('loadDraft').addEventListener('click', () => this.loadDraft());
        document.getElementById('exportHtml').addEventListener('click', () => this.exportHtml());

        // Atalhos de teclado
        document.getElementById('conteudo').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.addBlock();
            }
        });

        // Auto-save draft
        ['titulo', 'categoria', 'autor'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.updatePreview();
                this.autoSaveDraft();
            });
        });

        console.log('✅ Event listeners configurados');
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/test-connection`);
            const data = await response.json();
            
            if (data.success) {
                this.connectionStatus = 'connected';
                this.updateConnectionStatus('🔗 PostgreSQL Online', 'connected', data.message);
                this.updateAppStatus('✅ Servidor backend conectado ao PostgreSQL', 'success');
            } else {
                this.connectionStatus = 'offline';
                this.updateConnectionStatus('📁 Modo Offline', 'offline', data.message);
                this.updateAppStatus('⚠️ PostgreSQL desconectado - usando modo offline', 'warning');
            }
        } catch (error) {
            this.connectionStatus = 'error';
            this.updateConnectionStatus('❌ Erro de Conexão', 'error', 'Servidor backend não responde');
            this.updateAppStatus('❌ Erro: Servidor backend não está respondendo', 'error');
            console.error('Erro ao verificar conexão:', error);
        }
    }

    updateConnectionStatus(text, status, tooltip = '') {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = `status-indicator ${status}`;
            statusEl.title = tooltip;
        }
    }

    updateAppStatus(text, status) {
        const statusEl = document.getElementById('appStatus');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = `app-status ${status}`;
        }
    }

    addBlock() {
        const conteudo = document.getElementById('conteudo').value.trim();
        const tipo = document.getElementById('tipo').value;

        if (!conteudo) {
            this.showNotification('⚠️ Digite o conteúdo do bloco antes de adicionar', 'warning');
            document.getElementById('conteudo').focus();
            return;
        }

        const block = {
            id: Date.now(),
            content: conteudo,
            type: tipo,
            timestamp: new Date().toISOString()
        };

        this.blocks.push(block);
        this.renderBlocks();
        this.updatePreview();

        // Limpar campos
        document.getElementById('conteudo').value = '';
        document.getElementById('conteudo').focus();

        this.showNotification(`✅ Bloco ${tipo.toUpperCase()} adicionado`, 'success');
        console.log('Bloco adicionado:', block);
    }

    renderBlocks() {
        const container = document.getElementById('blocksList');
        
        if (this.blocks.length === 0) {
            container.innerHTML = '<p class="empty-state">Nenhum bloco adicionado ainda.</p>';
            return;
        }

        const blocksHtml = this.blocks.map((block, index) => `
            <div class="block-item" data-id="${block.id}">
                <div class="block-header">
                    <span class="block-type">${block.type.toUpperCase()}</span>
                    <div class="block-actions">
                        <button onclick="editor.moveBlock(${index}, -1)" ${index === 0 ? 'disabled' : ''} class="btn-small">↑</button>
                        <button onclick="editor.moveBlock(${index}, 1)" ${index === this.blocks.length - 1 ? 'disabled' : ''} class="btn-small">↓</button>
                        <button onclick="editor.editBlock(${index})" class="btn-small">✏️</button>
                        <button onclick="editor.removeBlock(${index})" class="btn-small btn-danger">🗑️</button>
                    </div>
                </div>
                <div class="block-content">${this.escapeHtml(block.content)}</div>
            </div>
        `).join('');

        container.innerHTML = blocksHtml;
    }

    moveBlock(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.blocks.length) return;

        [this.blocks[index], this.blocks[newIndex]] = [this.blocks[newIndex], this.blocks[index]];
        this.renderBlocks();
        this.updatePreview();
        this.showNotification('✅ Bloco reordenado', 'success');
    }

    editBlock(index) {
        const block = this.blocks[index];
        document.getElementById('conteudo').value = block.content;
        document.getElementById('tipo').value = block.type;
        
        this.removeBlock(index);
        document.getElementById('conteudo').focus();
        this.showNotification('✏️ Bloco carregado para edição', 'info');
    }

    removeBlock(index) {
        this.blocks.splice(index, 1);
        this.renderBlocks();
        this.updatePreview();
        this.showNotification('🗑️ Bloco removido', 'info');
    }

    updatePreview() {
        const titulo = document.getElementById('titulo').value;
        const categoria = document.getElementById('categoria').value;
        const autor = document.getElementById('autor').value;
        const preview = document.getElementById('preview');

        if (!titulo && this.blocks.length === 0) {
            preview.innerHTML = '<p class="empty-preview">A pré-visualização aparecerá aqui conforme você adiciona blocos de conteúdo.</p>';
            return;
        }

        let html = '';

        // Cabeçalho do artigo
        if (titulo || categoria || autor) {
            html += '<div class="article-header">';
            if (titulo) html += `<h1 class="article-title">${this.escapeHtml(titulo)}</h1>`;
            if (categoria || autor) {
                html += '<div class="article-meta">';
                if (categoria) html += `<span class="category">📂 ${this.escapeHtml(categoria)}</span>`;
                if (autor) html += `<span class="author">👤 ${this.escapeHtml(autor)}</span>`;
                html += '</div>';
            }
            html += '</div>';
        }

        // Conteúdo dos blocos
        if (this.blocks.length > 0) {
            html += '<div class="article-content">';
            this.blocks.forEach(block => {
                html += `<${block.type}>${this.escapeHtml(block.content)}</${block.type}>`;
            });
            html += '</div>';
        }

        preview.innerHTML = html;
    }

    async publishArticle() {
        const titulo = document.getElementById('titulo').value.trim();
        const categoria = document.getElementById('categoria').value;
        const autor = document.getElementById('autor').value.trim();

        // Validação
        if (!titulo || !categoria || !autor) {
            this.showNotification('⚠️ Preencha título, categoria e autor', 'warning');
            return;
        }

        if (this.blocks.length === 0) {
            this.showNotification('⚠️ Adicione pelo menos um bloco de conteúdo', 'warning');
            return;
        }

        // Gerar HTML do conteúdo
        const content = this.blocks.map(block => 
            `<${block.type}>${this.escapeHtml(block.content)}</${block.type}>`
        ).join('\n');

        const articleData = {
            titulo,
            categoria,
            autor,
            content
        };

        try {
            this.showNotification('🔄 Publicando artigo...', 'info');
            
            const response = await fetch(`${this.apiUrl}/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(articleData)
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`✅ ${result.message}`, 'success');
                this.clearForm();
                this.loadArticles(); // Recarregar lista
                
                console.log('Artigo publicado:', {
                    id: result.id,
                    slug: result.slug,
                    mode: result.mode
                });
            } else {
                this.showNotification(`❌ Erro: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao publicar artigo:', error);
            this.showNotification('❌ Erro de conexão ao publicar artigo', 'error');
        }
    }

    async loadArticles() {
        try {
            const response = await fetch(`${this.apiUrl}/articles`);
            const data = await response.json();

            const container = document.getElementById('articlesList');
            
            if (data.success && data.articles.length > 0) {
                const articlesHtml = data.articles.map(article => `
                    <div class="article-item">
                        <h4>${this.escapeHtml(article.titulo)}</h4>
                        <div class="article-meta">
                            <span>📂 ${this.escapeHtml(article.categoria)}</span>
                            <span>👤 ${this.escapeHtml(article.autor)}</span>
                            <span>📅 ${new Date(article.created_at).toLocaleDateString('pt-BR')}</span>
                            <span>🔗 ${article.slug}</span>
                        </div>
                    </div>
                `).join('');
                
                container.innerHTML = articlesHtml;
            } else {
                container.innerHTML = '<p class="empty-state">Nenhum artigo encontrado.</p>';
            }
        } catch (error) {
            console.error('Erro ao carregar artigos:', error);
            document.getElementById('articlesList').innerHTML = '<p class="error">Erro ao carregar artigos.</p>';
        }
    }

    clearForm() {
        if (this.blocks.length > 0 || document.getElementById('titulo').value) {
            if (!confirm('⚠️ Tem certeza que deseja limpar tudo? Todos os dados não salvos serão perdidos.')) {
                return;
            }
        }

        document.getElementById('titulo').value = '';
        document.getElementById('categoria').value = '';
        document.getElementById('autor').value = '';
        document.getElementById('conteudo').value = '';
        document.getElementById('tipo').value = 'p';
        
        this.blocks = [];
        this.renderBlocks();
        this.updatePreview();
        
        this.showNotification('🗑️ Formulário limpo', 'info');
        document.getElementById('titulo').focus();
    }

    // Funções de rascunho (usando Electron IPC)
    async saveDraft() {
        const draftData = {
            titulo: document.getElementById('titulo').value,
            categoria: document.getElementById('categoria').value,
            autor: document.getElementById('autor').value,
            blocks: this.blocks
        };

        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.saveDraft(draftData);
                if (result.success) {
                    this.showNotification('💾 ' + result.message, 'success');
                } else {
                    this.showNotification('❌ ' + result.message, 'error');
                }
            } catch (error) {
                this.showNotification('❌ Erro ao salvar rascunho', 'error');
            }
        } else {
            // Fallback para localStorage
            localStorage.setItem('draft-artigo', JSON.stringify(draftData));
            this.showNotification('💾 Rascunho salvo localmente', 'success');
        }
    }

    async loadDraft() {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.loadDraft();
                if (result.success) {
                    this.loadDraftData(result.data);
                    this.showNotification('📁 Rascunho carregado com sucesso', 'success');
                } else {
                    this.showNotification('❌ ' + result.message, 'error');
                }
            } catch (error) {
                this.showNotification('❌ Erro ao carregar rascunho', 'error');
            }
        } else {
            // Fallback para localStorage
            const draft = localStorage.getItem('draft-artigo');
            if (draft) {
                this.loadDraftData(JSON.parse(draft));
                this.showNotification('📁 Rascunho local carregado', 'success');
            } else {
                this.showNotification('❌ Nenhum rascunho encontrado', 'warning');
            }
        }
    }

    loadDraftData(data) {
        document.getElementById('titulo').value = data.titulo || '';
        document.getElementById('categoria').value = data.categoria || '';
        document.getElementById('autor').value = data.autor || '';
        
        this.blocks = data.blocks || [];
        this.renderBlocks();
        this.updatePreview();
    }

    async exportHtml() {
        const titulo = document.getElementById('titulo').value.trim();
        const content = this.generateFullHtml();

        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.exportHtml({
                    titulo: titulo || 'artigo',
                    content: content
                });
                if (result.success) {
                    this.showNotification('📄 ' + result.message, 'success');
                } else {
                    this.showNotification('❌ ' + result.message, 'error');
                }
            } catch (error) {
                this.showNotification('❌ Erro ao exportar HTML', 'error');
            }
        } else {
            // Fallback para download
            this.downloadHtml(content, titulo || 'artigo');
        }
    }

    generateFullHtml() {
        const titulo = document.getElementById('titulo').value;
        const categoria = document.getElementById('categoria').value;
        const autor = document.getElementById('autor').value;

        let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(titulo)}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .article-header { margin-bottom: 30px; }
        .article-title { color: #333; margin-bottom: 10px; }
        .article-meta { color: #666; font-size: 14px; }
        .article-content { line-height: 1.6; }
        h1, h2, h3, h4, h5, h6 { color: #333; margin-top: 30px; margin-bottom: 15px; }
        p { margin-bottom: 15px; }
    </style>
</head>
<body>`;

        if (titulo) {
            html += `    <div class="article-header">
        <h1 class="article-title">${this.escapeHtml(titulo)}</h1>`;
            
            if (categoria || autor) {
                html += `        <div class="article-meta">`;
                if (categoria) html += `Categoria: ${this.escapeHtml(categoria)} | `;
                if (autor) html += `Autor: ${this.escapeHtml(autor)}`;
                html += `</div>`;
            }
            html += `    </div>`;
        }

        if (this.blocks.length > 0) {
            html += `    <div class="article-content">`;
            this.blocks.forEach(block => {
                html += `        <${block.type}>${this.escapeHtml(block.content)}</${block.type}>\n`;
            });
            html += `    </div>`;
        }

        html += `</body>
</html>`;

        return html;
    }

    downloadHtml(content, filename) {
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('📄 HTML baixado com sucesso', 'success');
    }

    autoSaveDraft() {
        // Auto-save silencioso a cada 30 segundos
        if (!this.autoSaveTimer) {
            this.autoSaveTimer = setTimeout(() => {
                const draftData = {
                    titulo: document.getElementById('titulo').value,
                    categoria: document.getElementById('categoria').value,
                    autor: document.getElementById('autor').value,
                    blocks: this.blocks,
                    autoSave: true
                };
                
                localStorage.setItem('auto-draft-artigo', JSON.stringify(draftData));
                this.autoSaveTimer = null;
            }, 30000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Remover notificação anterior
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Inicializar aplicação
const editor = new EditorArtigos();

// Expor para debug
window.editor = editor;

console.log('✅ Editor de Artigos carregado - Versão Servidor Integrado');
