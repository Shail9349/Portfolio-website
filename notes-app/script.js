class NotesApp {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentNoteId = null;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.isPreviewMode = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadNotes();
        this.updateCategoryCounts();
        this.showEmptyState();
    }

    initializeElements() {
        // Sidebar elements
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.searchInput = document.getElementById('searchInput');
        this.categoryBtns = document.querySelectorAll('.category-btn');
        this.notesList = document.getElementById('notesList');
        this.totalNotes = document.getElementById('totalNotes');
        
        // Category count elements
        this.allCount = document.getElementById('allCount');
        this.personalCount = document.getElementById('personalCount');
        this.workCount = document.getElementById('workCount');
        this.ideasCount = document.getElementById('ideasCount');
        this.importantCount = document.getElementById('importantCount');
        
        // Editor elements
        this.noteTitle = document.getElementById('noteTitle');
        this.saveBtn = document.getElementById('saveBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.toolbarBtns = document.querySelectorAll('.toolbar-btn');
        this.categorySelect = document.getElementById('categorySelect');
        this.togglePreview = document.getElementById('togglePreview');
        this.editorContent = document.getElementById('editorContent');
        this.previewContent = document.getElementById('previewContent');
        
        // Info elements
        this.charCount = document.getElementById('charCount');
        this.wordCount = document.getElementById('wordCount');
        this.lastSaved = document.getElementById('lastSaved');
        
        // Empty state
        this.emptyState = document.getElementById('emptyState');
        this.emptyNewNote = document.getElementById('emptyNewNote');
    }

    bindEvents() {
        // Button events
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.emptyNewNote.addEventListener('click', () => this.createNewNote());
        this.saveBtn.addEventListener('click', () => this.saveNote());
        this.deleteBtn.addEventListener('click', () => this.deleteNote());
        this.togglePreview.addEventListener('click', () => this.togglePreviewMode());
        
        // Search and filter events
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.loadNotes();
        });
        
        this.categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setCategory(e.target.dataset.category);
            });
        });
        
        // Toolbar events
        this.toolbarBtns.forEach(btn => {
            if (btn.dataset.command) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.executeCommand(btn.dataset.command);
                });
            }
        });
        
        // Auto-save on content change
        this.noteTitle.addEventListener('input', () => this.autoSave());
        this.editorContent.addEventListener('input', () => {
            this.updateStats();
            this.autoSave();
        });
        
        // Category change
        this.categorySelect.addEventListener('change', () => this.autoSave());
    }

    createNewNote() {
        const newNote = {
            id: Date.now(),
            title: 'Untitled Note',
            content: '',
            category: 'personal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.notes.unshift(newNote);
        this.currentNoteId = newNote.id;
        this.loadNotes();
        this.editNote(newNote.id);
        this.hideEmptyState();
        
        // Focus on title
        setTimeout(() => {
            this.noteTitle.focus();
            this.noteTitle.select();
        }, 100);
    }

    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
        
        this.currentNoteId = noteId;
        this.noteTitle.value = note.title;
        this.editorContent.innerHTML = note.content;
        this.categorySelect.value = note.category;
        this.lastSaved.textContent = this.formatDate(note.updatedAt);
        
        this.updateStats();
        this.hideEmptyState();
        
        // Update active state in notes list
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.note-item[data-id="${noteId}"]`).classList.add('active');
    }

    saveNote() {
        if (!this.currentNoteId) return;
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        
        note.title = this.noteTitle.value || 'Untitled Note';
        note.content = this.editorContent.innerHTML;
        note.category = this.categorySelect.value;
        note.updatedAt = new Date().toISOString();
        
        this.saveToLocalStorage();
        this.loadNotes();
        this.updateCategoryCounts();
        
        // Show save confirmation
        this.showSaveConfirmation();
    }

    autoSave() {
        if (!this.currentNoteId) return;
        
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (!note) return;
        
        // Only auto-save if content has changed significantly
        const newTitle = this.noteTitle.value || 'Untitled Note';
        const newContent = this.editorContent.innerHTML;
        
        if (newTitle !== note.title || newContent !== note.content) {
            note.title = newTitle;
            note.content = newContent;
            note.category = this.categorySelect.value;
            note.updatedAt = new Date().toISOString();
            
            this.saveToLocalStorage();
            this.loadNotes();
            this.lastSaved.textContent = 'Just now';
        }
    }

    deleteNote() {
        if (!this.currentNoteId) return;
        
        if (confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            this.notes = this.notes.filter(n => n.id !== this.currentNoteId);
            this.saveToLocalStorage();
            this.currentNoteId = null;
            this.loadNotes();
            this.updateCategoryCounts();
            this.showEmptyState();
            this.clearEditor();
        }
    }

    setCategory(category) {
        this.currentCategory = category;
        
        // Update active category button
        this.categoryBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        this.loadNotes();
    }

    loadNotes() {
        let filteredNotes = this.notes;
        
        // Filter by category
        if (this.currentCategory !== 'all') {
            filteredNotes = filteredNotes.filter(note => note.category === this.currentCategory);
        }
        
        // Filter by search query
        if (this.searchQuery) {
            filteredNotes = filteredNotes.filter(note => 
                note.title.toLowerCase().includes(this.searchQuery) ||
                note.content.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Sort by updated date (newest first)
        filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        this.renderNotesList(filteredNotes);
        this.totalNotes.textContent = `(${filteredNotes.length})`;
    }

    renderNotesList(notes) {
        if (notes.length === 0) {
            this.notesList.innerHTML = `
                <div class="note-item" style="text-align: center; color: #718096; cursor: default;">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
                    <div>No notes found</div>
                </div>
            `;
            return;
        }
        
        this.notesList.innerHTML = notes.map(note => `
            <div class="note-item ${note.id === this.currentNoteId ? 'active' : ''}" 
                 data-id="${note.id}" 
                 onclick="notesApp.editNote(${note.id})">
                <div class="note-item-header">
                    <div class="note-item-title">${this.escapeHtml(note.title)}</div>
                    <span class="note-item-category">${note.category}</span>
                </div>
                <div class="note-item-preview">${this.getContentPreview(note.content)}</div>
                <div class="note-item-date">${this.formatDate(note.updatedAt)}</div>
            </div>
        `).join('');
    }

    getContentPreview(content) {
        // Remove HTML tags and get plain text preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        return text.substring(0, 100) + (text.length > 100 ? '...' : '');
    }

    updateCategoryCounts() {
        const counts = {
            all: this.notes.length,
            personal: this.notes.filter(n => n.category === 'personal').length,
            work: this.notes.filter(n => n.category === 'work').length,
            ideas: this.notes.filter(n => n.category === 'ideas').length,
            important: this.notes.filter(n => n.category === 'important').length
        };
        
        this.allCount.textContent = counts.all;
        this.personalCount.textContent = counts.personal;
        this.workCount.textContent = counts.work;
        this.ideasCount.textContent = counts.ideas;
        this.importantCount.textContent = counts.important;
    }

    executeCommand(command) {
        document.execCommand(command, false, null);
        this.editorContent.focus();
    }

    togglePreviewMode() {
        this.isPreviewMode = !this.isPreviewMode;
        
        if (this.isPreviewMode) {
            this.previewContent.innerHTML = this.editorContent.innerHTML;
            this.editorContent.style.display = 'none';
            this.previewContent.style.display = 'block';
            this.togglePreview.innerHTML = '<i class="fas fa-edit"></i> Edit';
            this.togglePreview.classList.add('active');
        } else {
            this.editorContent.style.display = 'block';
            this.previewContent.style.display = 'none';
            this.togglePreview.innerHTML = '<i class="fas fa-eye"></i> Preview';
            this.togglePreview.classList.remove('active');
        }
    }

    updateStats() {
        const content = this.editorContent.textContent || '';
        const charCount = content.length;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        
        this.charCount.textContent = `${charCount} characters`;
        this.wordCount.textContent = `${wordCount} words`;
    }

    showEmptyState() {
        this.emptyState.style.display = 'flex';
    }

    hideEmptyState() {
        this.emptyState.style.display = 'none';
    }

    clearEditor() {
        this.noteTitle.value = '';
        this.editorContent.innerHTML = '';
        this.categorySelect.value = 'personal';
        this.lastSaved.textContent = 'Never';
        this.updateStats();
    }

    showSaveConfirmation() {
        const originalText = this.saveBtn.innerHTML;
        this.saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        this.saveBtn.style.background = 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)';
        
        setTimeout(() => {
            this.saveBtn.innerHTML = originalText;
        }, 2000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    saveToLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
}

// Initialize the notes app
const notesApp = new NotesApp();