// Editor de Artigos - JavaScript Principal
class EditorArtigos {
    constructor() {
        this.blocos = [];
        this.apiBase = window.location.origin;
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.checkHealth();
        this.loadArticles();
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

    // Verificar status da API
    async checkHealth() {
        try {
            const response = await fetch(`${this.apiBase}/api/health`);
            const health = await response.json();
            
            let message = '';
            let statusClass = '';
            
            if (health.status === 'ok') {
                if (health.mode === 'postgresql') {
                    message = '✅ Conectado ao PostgreSQL';
                    statusClass = 'success';
                } else {
                    message = '⚠️ Modo local ativo (PostgreSQL indisponível)';
                    statusClass = 'warning';
                }
            } else {
                message = '❌ Erro no servidor';
                statusClass = 'error';
            }
            
            this.setStatus(message, statusClass);
        } catch (error) {
            this.setStatus('❌ Erro de conexão com o servidor', 'error');
            console.error('Erro ao verificar health:', error);
        }
    }

    // Definir status
    setStatus(message, type = '') {
        this.statusDiv.textContent = message;
        this.statusDiv.className = `status ${type}`;
    }

    // Adicionar bloco de conteúdo
    addBlock() {
        const conteudo = this.conteudoTextarea.value.trim();
        if (!conteudo) {
            alert('Digite o conteúdo do bloco!');
            this.conteudoTextarea.focus();
            return;
        }

        const tipo = this.tipoSelect.value;
        const bloco = {
            id: Date.now(),
            tipo: tipo,
            conteudo: conteudo,
            html: `<${tipo}>${this.escapeHtml(conteudo)}</${tipo}>`
        };

        this.blocos.push(bloco);
        this.updateBlocksList();
        this.updatePreview();
        
        // Limpar campos
        this.conteudoTextarea.value = '';
        this.tipoSelect.value = 'p';
        this.conteudoTextarea.focus();
        
        this.setStatus(`Bloco adicionado! Total: ${this.blocos.length}`, 'success');
    }

    // Atualizar lista de blocos
    updateBlocksList() {
        if (this.blocos.length === 0) {
            this.blocksListDiv.innerHTML = '<p class="empty-state">Nenhum bloco adicionado ainda.</p>';
            return;
        }

        const blocksHtml = this.blocos.map((bloco, index) => `
            <div class="block-item">
                <div class="block-content">
                    <div class="block-type">${bloco.tipo.toUpperCase()}</div>
                    <div class="block-text">${this.truncateText(bloco.conteudo, 150)}</div>
                </div>
                <div class="block-actions">
                    <button class="btn btn-move" onclick="editor.moveBlock(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">↑</button>
                    <button class="btn btn-move" onclick="editor.moveBlock(${index}, 1)" ${index === this.blocos.length - 1 ? 'disabled' : ''} title="Mover para baixo">↓</button>
                    <button class="btn btn-danger" onclick="editor.removeBlock(${index})" title="Remover bloco">🗑️</button>
                </div>
            </div>
        `).join('');

        this.blocksListDiv.innerHTML = blocksHtml;
    }

    // Atualizar pré-visualização
    updatePreview() {
        const titulo = this.tituloInput.value;
        const categoria = this.categoriaSelect.value;
        const autor = this.autorInput.value;

        let previewHtml = '';

        // Cabeçalho do artigo
        if (titulo || categoria || autor) {
            previewHtml += '<div class="preview-header">';
            if (titulo) {
                previewHtml += `<h1 class="preview-title">${this.escapeHtml(titulo)}</h1>`;
            }
            if (categoria || autor) {
                previewHtml += '<div class="preview-meta">';
                if (categoria) previewHtml += `<strong>Categoria:</strong> ${this.escapeHtml(categoria)} `;
                if (autor) previewHtml += `<strong>Autor:</strong> ${this.escapeHtml(autor)} `;
                previewHtml += `<strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}`;
                previewHtml += '</div>';
            }
            previewHtml += '</div>';
        }

        // Conteúdo dos blocos
        if (this.blocos.length > 0) {
            previewHtml += this.blocos.map(bloco => bloco.html).join('\n');
        }

        // Estado vazio
        if (!previewHtml) {
            previewHtml = '<p class="empty-preview">A pré-visualização aparecerá aqui conforme você adiciona blocos de conteúdo.</p>';
        }

        this.previewDiv.innerHTML = previewHtml;
    }

    // Mover bloco
    moveBlock(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.blocos.length) return;

        [this.blocos[index], this.blocos[newIndex]] = [this.blocos[newIndex], this.blocos[index]];
        this.updateBlocksList();
        this.updatePreview();
        this.setStatus('Bloco reordenado', 'success');
    }

    // Remover bloco
    removeBlock(index) {
        if (confirm('Deseja remover este bloco?')) {
            this.blocos.splice(index, 1);
            this.updateBlocksList();
            this.updatePreview();
            this.setStatus(`Bloco removido! Total: ${this.blocos.length}`, 'success');
        }
    }

    // Salvar rascunho
    saveDraft() {
        if (!this.tituloInput.value) {
            alert('Digite o título do artigo para salvar o rascunho!');
            this.tituloInput.focus();
            return;
        }

        const data = {
            titulo: this.tituloInput.value,
            categoria: this.categoriaSelect.value,
            autor: this.autorInput.value,
            blocos: this.blocos,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `rascunho-${this.generateSlug(this.tituloInput.value)}.json`;
        link.click();
        
        this.setStatus('✅ Rascunho baixado!', 'success');
    }

    // Carregar rascunho
    loadDraft() {
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
                        
                        // Validar estrutura do rascunho
                        if (!data.titulo || !Array.isArray(data.blocos)) {
                            throw new Error('Formato de rascunho inválido');
                        }
                        
                        this.tituloInput.value = data.titulo || '';
                        this.categoriaSelect.value = data.categoria || '';
                        this.autorInput.value = data.autor || '';
                        this.blocos = data.blocos || [];
                        
                        this.updateBlocksList();
                        this.updatePreview();
                        this.setStatus('✅ Rascunho carregado!', 'success');
                    } catch (error) {
                        alert('Erro ao carregar rascunho: ' + error.message);
                        this.setStatus('❌ Erro ao carregar rascunho', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // Exportar HTML
    exportHtml() {
        if (!this.tituloInput.value || this.blocos.length === 0) {
            alert('Preencha o título e adicione pelo menos um bloco para exportar!');
            return;
        }

        const htmlContent = this.generateFullHtml();
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(htmlBlob);
        link.download = `${this.generateSlug(this.tituloInput.value)}.html`;
        link.click();
        
        this.setStatus('✅ HTML exportado!', 'success');
    }

    // Limpar formulário
    clearForm() {
        if (this.blocos.length > 0 || this.tituloInput.value) {
            if (!confirm('Deseja realmente limpar todo o formulário? Esta ação não pode ser desfeita.')) {
                return;
            }
        }

        this.tituloInput.value = '';
        this.categoriaSelect.value = '';
        this.autorInput.value = '';
        this.conteudoTextarea.value = '';
        this.tipoSelect.value = 'p';
        this.blocos = [];
        
        this.updateBlocksList();
        this.updatePreview();
        this.setStatus('Formulário limpo - Pronto para novo artigo', 'success');
        this.tituloInput.focus();
    }

    // Publicar artigo
    async publishArticle() {
        // Validação
        if (!this.tituloInput.value || !this.categoriaSelect.value || !this.autorInput.value || this.blocos.length === 0) {
            alert('Preencha todos os campos obrigatórios e adicione pelo menos um bloco!');
            return;
        }

        if (!confirm('Deseja publicar este artigo? Esta ação enviará o artigo para o banco de dados.')) {
            return;
        }

        this.setStatus('📤 Publicando artigo...', 'warning');
        this.publishBtn.disabled = true;

        try {
            const articleData = {
                titulo: this.tituloInput.value,
                categoria: this.categoriaSelect.value,
                autor: this.autorInput.value,
                content: this.generateContentHtml()
            };

            const response = await fetch(`${this.apiBase}/api/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(articleData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.setStatus(`✅ ${result.message}`, 'success');
                
                let alertMessage = `Artigo publicado com sucesso!\n\nID: ${result.id}\nSlug: ${result.slug}`;
                if (result.mode) {
                    alertMessage += `\nModo: ${result.mode}`;
                }
                
                alert(alertMessage);
                
                // Recarregar lista de artigos
                this.loadArticles();
                
                if (confirm('Deseja limpar o formulário para criar um novo artigo?')) {
                    this.clearForm();
                }
            } else {
                this.setStatus('❌ Erro ao publicar artigo', 'error');
                alert('Erro ao publicar: ' + result.message);
            }
        } catch (error) {
            this.setStatus('❌ Erro de conexão', 'error');
            alert('Erro ao publicar: ' + error.message);
            console.error('Erro ao publicar artigo:', error);
        } finally {
            this.publishBtn.disabled = false;
        }
    }

    // Carregar lista de artigos
    async loadArticles() {
        try {
            this.articlesListDiv.innerHTML = '<p class="loading">Carregando artigos...</p>';
            
            const response = await fetch(`${this.apiBase}/api/articles`);
            const result = await response.json();
            
            if (result.success && result.articles.length > 0) {
                const articlesHtml = result.articles.map(article => `
                    <div class="article-item">
                        <div class="article-info">
                            <h4>${this.escapeHtml(article.titulo)}</h4>
                            <div class="article-meta">
                                <strong>Categoria:</strong> ${this.escapeHtml(article.categoria)} | 
                                <strong>Autor:</strong> ${this.escapeHtml(article.autor)} | 
                                <strong>Data:</strong> ${article.data_criacao} | 
                                <strong>Status:</strong> ${article.status}
                                ${article.slug ? ` | <strong>Slug:</strong> ${article.slug}` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
                
                this.articlesListDiv.innerHTML = articlesHtml;
            } else {
                this.articlesListDiv.innerHTML = '<p class="empty-state">Nenhum artigo encontrado.</p>';
            }
        } catch (error) {
            this.articlesListDiv.innerHTML = '<p class="empty-state">Erro ao carregar artigos.</p>';
            console.error('Erro ao carregar artigos:', error);
        }
    }

    // Gerar HTML do conteúdo
    generateContentHtml() {
        return this.blocos.map(bloco => bloco.html).join('\n');
    }

    // Gerar HTML completo
    generateFullHtml() {
        const titulo = this.escapeHtml(this.tituloInput.value);
        const categoria = this.escapeHtml(this.categoriaSelect.value);
        const autor = this.escapeHtml(this.autorInput.value);
        const content = this.generateContentHtml();

        return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            line-height: 1.6;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 { 
            color: #dc2626; 
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h1 { font-size: 2.5rem; margin-top: 0; }
        h2 { font-size: 2rem; }
        h3 { font-size: 1.5rem; }
        p { 
            margin-bottom: 20px; 
            text-align: justify;
        }
        .meta { 
            color: #666; 
            font-style: italic; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #eee; 
            padding-bottom: 20px; 
        }
        .meta strong { color: #333; }
    </style>
</head>
<body>
    <h1>${titulo}</h1>
    <div class="meta">
        <strong>Categoria:</strong> ${categoria}<br>
        <strong>Autor:</strong> ${autor}<br>
        <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
    </div>
    ${content}
</body>
</html>`;
    }

    // Gerar slug
    generateSlug(titulo) {
        return titulo
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    // Escapar HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Truncar texto
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }
}

// Inicializar aplicação quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new EditorArtigos();
});

// Expor editor globalmente para uso nos botões inline
window.editor = null;
