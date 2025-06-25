class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.currentFilter = 'all';
        this.isEditing = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateStats();
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        if (this.todos.length === 0) {
            setTimeout(() => {
                document.getElementById('todoInput').focus();
            }, 500);
        }
    }

    bindEvents() {
        const todoInput = document.getElementById('todoInput');
        const addBtn = document.getElementById('addBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');

        // Add todo with better validation
        addBtn.addEventListener('click', () => this.addTodo());
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isEditing) this.addTodo();
        });

        // Input validation and feedback
        todoInput.addEventListener('input', (e) => {
            const text = e.target.value.trim();
            addBtn.style.opacity = text ? '1' : '0.6';
            addBtn.disabled = !text;
        });

        // Filter todos with smooth transition
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('active')) return;
                
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.setFilter('all');
                        break;
                    case '2':
                        e.preventDefault();
                        this.setFilter('pending');
                        break;
                    case '3':
                        e.preventDefault();
                        this.setFilter('completed');
                        break;
                }
            }
        });
    }

    setFilter(filter) {
        document.querySelector(`[data-filter="${filter}"]`).click();
    }

    addTodo() {
        const todoInput = document.getElementById('todoInput');
        const text = todoInput.value.trim();
        
        if (!text || text.length > 100) {
            this.showNotification('Please enter a valid task (max 100 characters)', 'error');
            return;
        }

        // Check for duplicates
        if (this.todos.some(todo => todo.text.toLowerCase() === text.toLowerCase())) {
            this.showNotification('This task already exists!', 'warning');
            todoInput.focus();
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'normal'
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.render();
        this.updateStats();
        todoInput.value = '';
        todoInput.focus();
        
        this.showNotification('Task added successfully!', 'success');
    }

    deleteTodo(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.render();
        this.updateStats();
        this.showNotification('Task deleted successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            todo.completedAt = todo.completed ? new Date().toISOString() : null;
            this.saveTodos();
            this.render();
            this.updateStats();
            
            const message = todo.completed ? 'Task completed! 🎉' : 'Task marked as pending';
            this.showNotification(message, 'success');
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo && newText.trim() && newText.trim() !== todo.text) {
            todo.text = newText.trim();
            todo.updatedAt = new Date().toISOString();
            this.saveTodos();
            this.render();
            this.showNotification('Task updated successfully!', 'success');
        }
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    render() {
        const todoList = document.getElementById('todoList');
        const filteredTodos = this.getFilteredTodos();

        // Smooth transition
        todoList.style.opacity = '0.5';
        
        setTimeout(() => {
            todoList.innerHTML = '';

            if (filteredTodos.length === 0) {
                const emptyState = this.createEmptyState();
                todoList.appendChild(emptyState);
            } else {
                filteredTodos.forEach((todo, index) => {
                    const li = this.createTodoItem(todo, index);
                    todoList.appendChild(li);
                });
            }
            
            todoList.style.opacity = '1';
        }, 150);
    }

    createEmptyState() {
        const li = document.createElement('li');
        li.className = 'todo-item empty-state';
        
        const emptyMessages = {
            all: { icon: 'fas fa-clipboard', text: 'No tasks yet. Add your first task above!' },
            pending: { icon: 'fas fa-check-circle', text: 'All tasks completed! Great job! 🎉' },
            completed: { icon: 'fas fa-clock', text: 'No completed tasks yet. Get started!' }
        };
        
        const message = emptyMessages[this.currentFilter];
        li.innerHTML = `
            <div style="text-align: center; width: 100%;">
                <i class="${message.icon}" style="font-size: 48px; color: #cbd5e0; margin-bottom: 16px; display: block;"></i>
                <span class="todo-text">${message.text}</span>
            </div>
        `;
        
        return li;
    }

    createTodoItem(todo, index) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.style.animationDelay = `${index * 50}ms`;
        
        const createdDate = new Date(todo.createdAt).toLocaleDateString();
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   aria-label="Mark task as ${todo.completed ? 'pending' : 'completed'}">
            <span class="todo-text" title="Created: ${createdDate}">${this.escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button class="edit-btn" title="Edit task" aria-label="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" title="Delete task" aria-label="Delete task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Bind events
        this.bindTodoEvents(li, todo);
        
        return li;
    }

    bindTodoEvents(li, todo) {
        const checkbox = li.querySelector('.todo-checkbox');
        const editBtn = li.querySelector('.edit-btn');
        const deleteBtn = li.querySelector('.delete-btn');
        const todoText = li.querySelector('.todo-text');

        checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
        editBtn.addEventListener('click', () => this.startEdit(todoText, todo.id));
        
        // Double click to edit
        todoText.addEventListener('dblclick', () => this.startEdit(todoText, todo.id));
    }

    startEdit(textElement, todoId) {
        if (this.isEditing) return;
        
        this.isEditing = true;
        const currentText = textElement.textContent;
        const input = document.createElement('input');
        
        input.type = 'text';
        input.value = currentText;
        input.className = 'todo-text';
        input.style.cssText = `
            border: 2px solid #667eea;
            padding: 8px 12px;
            border-radius: 6px;
            background: white;
            font-size: 16px;
            font-weight: 500;
            width: 100%;
            outline: none;
        `;
        input.maxLength = 100;

        textElement.parentNode.replaceChild(input, textElement);
        input.focus();
        input.select();

        const finishEdit = () => {
            if (!this.isEditing) return;
            
            const newText = input.value.trim();
            const span = document.createElement('span');
            span.className = 'todo-text';
            span.textContent = newText || currentText;
            
            input.parentNode.replaceChild(span, input);
            this.isEditing = false;
            
            if (newText && newText !== currentText) {
                this.editTodo(todoId, newText);
            } else {
                this.render(); // Re-render to restore original state
            }
        };

        const cancelEdit = () => {
            if (!this.isEditing) return;
            
            const span = document.createElement('span');
            span.className = 'todo-text';
            span.textContent = currentText;
            
            input.parentNode.replaceChild(span, input);
            this.isEditing = false;
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') finishEdit();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') cancelEdit();
        });
    }

    updateStats() {
        const totalTasks = document.getElementById('totalTasks');
        const completedTasks = document.getElementById('completedTasks');
        const pendingTasks = document.getElementById('pendingTasks');
        
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        totalTasks.textContent = total;
        completedTasks.textContent = completed;
        pendingTasks.textContent = pending;
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (error) {
            this.showNotification('Failed to save data. Storage might be full.', 'error');
        }
    }

    // Export/Import functionality
    exportTodos() {
        const dataStr = JSON.stringify(this.todos, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});

// Service Worker for offline capability (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}