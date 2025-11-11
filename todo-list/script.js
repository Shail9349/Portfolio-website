class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('todoTasks')) || [];
        this.currentFilter = 'all';
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.addBtn = document.getElementById('addBtn');
        this.taskList = document.getElementById('taskList');
        this.emptyState = document.getElementById('emptyState');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        
        // Stats elements
        this.totalTasksEl = document.getElementById('totalTasks');
        this.completedTasksEl = document.getElementById('completedTasks');
        this.pendingTasksEl = document.getElementById('pendingTasks');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
                this.updateFilterButtons(e.target);
            });
        });
    }

    addTask() {
        const text = this.taskInput.value.trim();
        if (text === '') {
            this.shakeInput();
            return;
        }

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.taskInput.value = '';
        this.saveToLocalStorage();
        this.render();
        
        // Add animation for new task
        this.animateNewTask();
    }

    editTask(id, newText) {
        if (newText.trim() === '') {
            this.deleteTask(id);
            return;
        }

        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, text: newText.trim() } : task
        );
        
        this.saveToLocalStorage();
        this.render();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveToLocalStorage();
        this.render();
    }

    toggleTask(id) {
        this.tasks = this.tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        
        this.saveToLocalStorage();
        this.render();
        
        // Add completion animation
        this.animateCompletion(id);
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.saveToLocalStorage();
        this.render();
    }

    setFilter(filter) {
        this.currentFilter = filter;
        this.render();
    }

    updateFilterButtons(activeBtn) {
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'completed':
                return this.tasks.filter(task => task.completed);
            case 'pending':
                return this.tasks.filter(task => !task.completed);
            default:
                return this.tasks;
        }
    }

    render() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            this.taskList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.taskList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.taskList.innerHTML = filteredTasks.map(task => `
                <div class="task-item" data-id="${task.id}">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="todoApp.toggleTask(${task.id})">
                    </div>
                    <span class="task-text ${task.completed ? 'completed' : ''}">
                        ${this.escapeHtml(task.text)}
                    </span>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="todoApp.startEdit(${task.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" onclick="todoApp.deleteTask(${task.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        this.updateStats();
        this.updateClearButton();
    }

    startEdit(id) {
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        const taskText = taskItem.querySelector('.task-text');
        const currentText = taskText.textContent;

        taskText.innerHTML = `
            <input type="text" class="edit-input" value="${this.escapeHtml(currentText)}" 
                   onblur="todoApp.finishEdit(${id}, this.value)"
                   onkeypress="if(event.key==='Enter') this.blur()"
                   autofocus>
        `;
        
        const input = taskText.querySelector('.edit-input');
        input.focus();
        input.select();
    }

    finishEdit(id, newText) {
        this.editTask(id, newText);
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const pending = total - completed;

        this.totalTasksEl.textContent = total;
        this.completedTasksEl.textContent = completed;
        this.pendingTasksEl.textContent = pending;
    }

    updateClearButton() {
        const hasCompleted = this.tasks.some(task => task.completed);
        this.clearCompletedBtn.disabled = !hasCompleted;
    }

    saveToLocalStorage() {
        localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Animation methods
    shakeInput() {
        this.taskInput.style.animation = 'none';
        setTimeout(() => {
            this.taskInput.style.animation = 'shake 0.5s ease-in-out';
        }, 10);
    }

    animateNewTask() {
        const newTask = this.taskList.firstElementChild;
        if (newTask) {
            newTask.style.animation = 'slideIn 0.3s ease-out';
        }
    }

    animateCompletion(id) {
        const taskItem = document.querySelector(`.task-item[data-id="${id}"]`);
        if (taskItem) {
            taskItem.style.transform = 'scale(1.02)';
            setTimeout(() => {
                taskItem.style.transform = 'scale(1)';
            }, 200);
        }
    }
}

// Add shake animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .edit-input {
        width: 100%;
        padding: 5px;
        border: 2px solid #667eea;
        border-radius: 5px;
        font-size: 1rem;
        outline: none;
    }
`;
document.head.appendChild(style);

// Initialize the app
const todoApp = new TodoApp();