class NotesApp {
    constructor() {
        this.notes = this.loadNotes();
        this.editingId = null;
        this.theme = this.loadTheme();
        this.init();
    }

    init() {
        this.applyTheme();
        this.render();
        this.attachEventListeners();
    }

    loadTheme() {
        return localStorage.getItem('theme') || 'system';
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    getEffectiveTheme() {
        if (this.theme === 'system') {
            return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        return this.theme;
    }

    applyTheme() {
        var root = document.documentElement;
        var effective = this.getEffectiveTheme();

        if (effective === 'light') {
            root.setAttribute('data-theme', 'light');
        } else {
            root.removeAttribute('data-theme');
        }

        var options = document.querySelectorAll('.theme-option');
        var indicator = document.getElementById('themeIndicator');
        var positions = { system: 0, light: 1, dark: 2 };

        options.forEach(function (opt) {
            opt.classList.toggle('active', opt.getAttribute('data-theme') === this.theme);
        }.bind(this));

        if (indicator) {
            indicator.style.transform = 'translateX(' + (positions[this.theme] * 28) + 'px)';
        }
    }

    setTheme(theme) {
        this.theme = theme;
        this.saveTheme(theme);
        this.applyTheme();
    }

    loadNotes() {
        var stored = localStorage.getItem('notes');
        return stored ? JSON.parse(stored) : [];
    }

    saveNotes() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    addNote(title, content) {
        var note = {
            id: Date.now(),
            title: title || 'Untitled Note',
            content: content,
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };
        this.notes.unshift(note);
        this.saveNotes();
        this.render();
    }

    deleteNote(id) {
        this.notes = this.notes.filter(function (note) { return note.id !== id; });
        this.saveNotes();
        this.render();
        this.showNotification('NOTE DELETED');
    }

    showNotification(text) {
        var existing = document.querySelector('.notification');
        if (existing) existing.remove();

        var el = document.createElement('div');
        el.className = 'notification';
        el.textContent = text;
        document.body.appendChild(el);

        setTimeout(function () { el.classList.add('show'); }, 10);
        setTimeout(function () {
            el.classList.remove('show');
            setTimeout(function () { el.remove(); }, 300);
        }, 2000);
    }

    editNote(id) {
        var note = this.notes.find(function (n) { return n.id === id; });
        if (note) {
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('noteContent').value = note.content;
            document.getElementById('addNoteBtn').textContent = 'UPDATE NOTE →';
            this.editingId = id;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    updateNote(id, title, content) {
        var note = this.notes.find(function (n) { return n.id === id; });
        if (note) {
            note.title = title || 'Untitled Note';
            note.content = content;
            note.date = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            this.saveNotes();
            this.render();
        }
    }

    searchNotes(query) {
        var filtered = this.notes.filter(function (note) {
            return note.title.toLowerCase().includes(query.toLowerCase()) ||
                note.content.toLowerCase().includes(query.toLowerCase());
        });
        this.renderNotes(filtered);
    }

    renderNotes(notesToRender) {
        if (!notesToRender) notesToRender = this.notes;
        var grid = document.getElementById('notesGrid');
        var emptyState = document.getElementById('emptyState');

        if (notesToRender.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        grid.innerHTML = notesToRender.map(function (note, i) {
            var delay = Math.min(50 + i * 70, 400);
            return '<div class="note-card" style="animation-delay:' + delay + 'ms">' +
                '<div class="note-date">' + note.date + '</div>' +
                '<div class="note-title">' + this.escapeHtml(note.title) + '</div>' +
                '<div class="note-content">' + this.escapeHtml(note.content) + '</div>' +
                '<div class="note-actions">' +
                '<button class="btn-action" onclick="app.editNote(' + note.id + ')">EDIT →</button>' +
                '<button class="btn-action" onclick="app.deleteNote(' + note.id + ')">DELETE</button>' +
                '<span class="read-time">' + this.calculateReadTime(note.content) + ' MIN</span>' +
                '</div></div>';
        }.bind(this)).join('');
    }

    escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    calculateReadTime(content) {
        var wordsPerMinute = 200;
        var words = content.trim().split(/\s+/).length;
        var time = Math.ceil(words / wordsPerMinute);
        return time || 1;
    }

    render() {
        this.renderNotes();
    }

    attachEventListeners() {
        var addBtn = document.getElementById('addNoteBtn');
        var titleInput = document.getElementById('noteTitle');
        var contentInput = document.getElementById('noteContent');
        var searchInput = document.getElementById('searchInput');

        document.querySelectorAll('.theme-option').forEach(function (btn) {
            btn.addEventListener('click', function () {
                this.setTheme(btn.getAttribute('data-theme'));
            }.bind(this));
        }.bind(this));

        addBtn.addEventListener('click', function () {
            var title = titleInput.value.trim();
            var content = contentInput.value.trim();

            if (this.editingId) {
                this.updateNote(this.editingId, title, content);
                this.editingId = null;
                addBtn.textContent = 'SAVE NOTE →';
            } else {
                this.addNote(title, content);
            }

            titleInput.value = '';
            contentInput.value = '';
        }.bind(this));

        titleInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                contentInput.focus();
            }
        });

        contentInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                addBtn.click();
            }
        });

        searchInput.addEventListener('input', function (e) {
            this.searchNotes(e.target.value);
        }.bind(this));
    }
}

var app = new NotesApp();
