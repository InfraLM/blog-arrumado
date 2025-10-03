// Métodos para upload e manipulação de imagens

// Atualizar contador de caracteres do resumo
updateCharCount() {
    const count = this.resumoTextarea.value.length;
    this.resumoCount.textContent = count;
    
    // Adicionar classes de aviso
    this.resumoCount.parentElement.classList.remove('warning', 'error');
    if (count > 400) {
        this.resumoCount.parentElement.classList.add('warning');
    }
    if (count > 500) {
        this.resumoCount.parentElement.classList.add('error');
    }
}

// Mostrar/ocultar upload de imagem de bloco
toggleBlockImageUpload() {
    const isImage = this.tipoSelect.value === 'image';
    this.blockImageUpload.style.display = isImage ? 'block' : 'none';
    this.conteudoTextarea.style.display = isImage ? 'none' : 'block';
    
    if (isImage) {
        this.conteudoTextarea.value = '';
    } else {
        this.removeImage('block');
    }
}

// Manipular drag over
handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

// Manipular drop
handleDrop(e, type) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        this.uploadImage(files[0], type);
    }
}

// Manipular seleção de arquivo
handleImageSelect(e, type) {
    const file = e.target.files[0];
    if (file) {
        this.uploadImage(file, type);
    }
}

// Upload de imagem
async uploadImage(file, type) {
    // Validar arquivo
    if (!file.type.startsWith('image/')) {
        this.showStatus('❌ Apenas arquivos de imagem são permitidos', 'error');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        this.showStatus('❌ Arquivo muito grande. Máximo 10MB', 'error');
        return;
    }
    
    const uploadArea = type === 'principal' ? this.uploadArea : this.blockUploadArea;
    const preview = type === 'principal' ? this.imagemPreview : this.blockImagePreview;
    const previewImg = type === 'principal' ? this.imagemPreviewImg : this.blockImagePreviewImg;
    const urlSpan = type === 'principal' ? this.imagemUrl : this.blockImageUrl;
    
    try {
        // Mostrar loading
        uploadArea.classList.add('upload-loading');
        this.showStatus('📤 Fazendo upload da imagem...', 'info');
        
        // Criar FormData
        const formData = new FormData();
        formData.append('image', file);
        
        // Fazer upload
        const response = await fetch(`${this.apiUrl}/upload-image`, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Mostrar preview
            previewImg.src = result.image.url;
            urlSpan.textContent = result.image.url;
            preview.style.display = 'block';
            
            // Salvar URL
            if (type === 'principal') {
                this.imagemPrincipalUrl = result.image.url;
            } else {
                this.currentBlockImageUrl = result.image.url;
            }
            
            this.showStatus('✅ Imagem enviada com sucesso!', 'success');
            this.updatePreview();
        } else {
            throw new Error(result.message || 'Erro no upload');
        }
    } catch (error) {
        console.error('Erro no upload:', error);
        this.showStatus(`❌ Erro no upload: ${error.message}`, 'error');
    } finally {
        uploadArea.classList.remove('upload-loading');
    }
}

// Remover imagem
removeImage(type) {
    if (type === 'principal') {
        this.imagemPrincipalUrl = null;
        this.imagemPreview.style.display = 'none';
        this.imagemPrincipalInput.value = '';
    } else {
        this.currentBlockImageUrl = null;
        this.blockImagePreview.style.display = 'none';
        this.blockImageInput.value = '';
    }
    this.updatePreview();
}

// Adicionar bloco com suporte a imagem
addBlock() {
    const tipo = this.tipoSelect.value;
    const conteudo = this.conteudoTextarea.value.trim();
    
    if (tipo === 'image') {
        if (!this.currentBlockImageUrl) {
            this.showStatus('❌ Selecione uma imagem para o bloco', 'error');
            return;
        }
        
        // Criar bloco de imagem
        const block = {
            type: 'image',
            content: this.currentBlockImageUrl,
            alt: 'Imagem do artigo'
        };
        
        this.blocks.push(block);
        this.renderBlocks();
        this.updatePreview();
        
        // Limpar
        this.removeImage('block');
        this.toggleBlockImageUpload();
        
    } else {
        if (!conteudo) {
            this.showStatus('❌ Digite o conteúdo do bloco', 'error');
            return;
        }
        
        // Criar bloco de texto
        const block = {
            type: tipo,
            content: conteudo
        };
        
        this.blocks.push(block);
        this.renderBlocks();
        this.updatePreview();
        
        // Limpar
        this.conteudoTextarea.value = '';
    }
    
    this.showStatus('✅ Bloco adicionado com sucesso!', 'success');
}

// Gerar HTML com suporte a imagens
generateHtml() {
    const titulo = this.tituloInput.value.trim();
    const categoria = this.categoriaSelect.value;
    const autor = this.autorInput.value.trim();
    const coautor = this.coautorInput.value.trim();
    const resumo = this.resumoTextarea.value.trim();
    const destaque = this.destaqueSelect.value === 'true';
    
    let html = '';
    
    // Imagem principal
    if (this.imagemPrincipalUrl) {
        html += `<div class="imagem-principal">
            <img src="${this.imagemPrincipalUrl}" alt="${titulo}" style="width: 100%; height: auto; margin-bottom: 1rem;">
        </div>\n\n`;
    }
    
    // Resumo
    if (resumo) {
        html += `<div class="resumo">
            <p><strong>Resumo:</strong> ${resumo}</p>
        </div>\n\n`;
    }
    
    // Blocos de conteúdo
    this.blocks.forEach(block => {
        if (block.type === 'image') {
            html += `<div class="imagem-bloco">
                <img src="${block.content}" alt="${block.alt || 'Imagem do artigo'}" style="width: 100%; height: auto; margin: 1rem 0;">
            </div>\n\n`;
        } else {
            html += `<${block.type}>${block.content}</${block.type}>\n\n`;
        }
    });
    
    // Informações do autor
    html += `<div class="autor-info">
        <p><strong>Autor:</strong> ${autor}`;
    
    if (coautor) {
        html += ` | <strong>Co-autor:</strong> ${coautor}`;
    }
    
    html += `</p>
        <p><strong>Categoria:</strong> ${categoria}</p>`;
    
    if (destaque) {
        html += `<p><strong>Artigo em Destaque</strong></p>`;
    }
    
    html += `</div>`;
    
    return html;
}
