// Initialize Lucide icons
lucide.createIcons();

// Constants
const STORAGE_KEY = 'todo-tasks';
const CATEGORIES = ['Personal', 'Work', 'Shopping', 'Health', 'Education'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

// DOM Elements
const taskList = document.getElementById('taskList');
const addTaskBtn = document.getElementById('addTaskBtn');
const filterButtons = document.getElementById('filterButtons');
const sortSelect = document.getElementById('sortSelect');
const taskTemplate = document.getElementById('taskTemplate');

// State
let tasks = [];
let currentFilter = 'All';
let currentSort = 'created';

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
    updateUI();
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    updateUI();
}

// Add new task
function addTask() {
    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const categorySelect = document.getElementById('taskCategory');
    const prioritySelect = document.getElementById('taskPriority');
    const dueDateInput = document.getElementById('taskDueDate');

    if (titleInput.value.trim()) {
        const task = {
            id: Date.now(),
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            category: categorySelect.value,
            priority: prioritySelect.value,
            dueDate: dueDateInput.value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.push(task);
        saveTasks();

        // Reset form
        titleInput.value = '';
        descriptionInput.value = '';
        categorySelect.value = 'Personal';
        prioritySelect.value = 'Medium';
        dueDateInput.value = '';
    }
}

// Delete task
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
}

// Toggle task completion
function toggleComplete(id) {
    tasks = tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
    );
    
    // Find the task element and update its classes
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
        const completeBtn = taskElement.querySelector('.complete-btn');
        const taskTitle = taskElement.querySelector('.task-title');
        const taskDescription = taskElement.querySelector('.task-description');
        const task = tasks.find(t => t.id === id);
        
        if (task.completed) {
            completeBtn.classList.add('completed');
            taskTitle.classList.add('completed');
            if (taskDescription) {
                taskDescription.classList.add('completed');
            }
            taskElement.style.borderLeftColor = '#34D399'; // Green
        } else {
            completeBtn.classList.remove('completed');
            taskTitle.classList.remove('completed');
            if (taskDescription) {
                taskDescription.classList.remove('completed');
            }
            // Restore the priority color
            const priorityColors = {
                'Urgent': '#EF4444',
                'High': '#F97316',
                'Medium': '#3B82F6',
                'Low': '#34D399'
            };
            taskElement.style.borderLeftColor = priorityColors[task.priority];
        }
    }
    saveTasks();
}

// Start editing task
function startEdit(taskElement, task) {
    const taskContent = taskElement.querySelector('.task-content');
    
    // Create edit form
    const editForm = document.createElement('form');
    editForm.className = 'edit-form';
    editForm.innerHTML = `
        <input type="text" class="form-input" value="${task.title}" data-field="title">
        <textarea class="form-input" data-field="description" rows="2">${task.description}</textarea>
        <div class="edit-form-grid">
            <select class="form-input" data-field="category">
                ${CATEGORIES.map(cat => `
                    <option value="${cat}" ${cat === task.category ? 'selected' : ''}>
                        ${cat}
                    </option>
                `).join('')}
            </select>
            <select class="form-input" data-field="priority">
                ${PRIORITIES.map(priority => `
                    <option value="${priority}" ${priority === task.priority ? 'selected' : ''}>
                        ${priority}
                    </option>
                `).join('')}
            </select>
            <input type="date" class="form-input" value="${task.dueDate}" data-field="dueDate">
        </div>
        <div class="edit-actions">
            <button type="button" class="btn-save">
                <i data-lucide="check"></i>
                Save
            </button>
            <button type="button" class="btn-cancel">
                <i data-lucide="x"></i>
                Cancel
            </button>
        </div>
    `;

    taskContent.style.display = 'none';
    taskElement.appendChild(editForm);
    
    // Initialize icons in the edit form
    lucide.createIcons({
        icons: {
            check: 'check',
            x: 'x'
        }
    });

    // Save button handler
    editForm.querySelector('.btn-save').addEventListener('click', () => {
        const updatedTask = { ...task };
        editForm.querySelectorAll('[data-field]').forEach(input => {
            updatedTask[input.dataset.field] = input.value;
        });
        tasks = tasks.map(t => t.id === task.id ? updatedTask : t);
        saveTasks();
        editForm.remove();
        taskContent.style.display = 'flex';
    });

    // Cancel button handler
    editForm.querySelector('.btn-cancel').addEventListener('click', () => {
        editForm.remove();
        taskContent.style.display = 'flex';
    });
}

// Helper function to format due date
function formatDueDate(dueDate) {
    if (!dueDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDateTime = new Date(dueDate);
    dueDateTime.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((dueDateTime - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: 'Overdue', isOverdue: true };
    } else if (diffDays === 0) {
        return { text: 'Due Today', isOverdue: false };
    } else if (diffDays === 1) {
        return { text: 'Due Tomorrow', isOverdue: false };
    } else {
        return { text: `${diffDays} days`, isOverdue: false };
    }
}

// Render a single task
function renderTask(task) {
    const taskElement = taskTemplate.content.cloneNode(true).children[0];
    
    // Add task ID to the element
    taskElement.setAttribute('data-task-id', task.id);
    
    // Set border color based on priority and completion
    if (task.completed) {
        taskElement.style.borderLeftColor = '#34D399'; // Green
    } else if (task.dueDate && new Date(task.dueDate) < new Date().setHours(0,0,0,0)) {
        taskElement.style.borderLeftColor = '#EF4444'; // Red
    } else {
        const priorityColors = {
            'Urgent': '#EF4444',
            'High': '#F97316',
            'Medium': '#3B82F6',
            'Low': '#34D399'
        };
        taskElement.style.borderLeftColor = priorityColors[task.priority];
    }

    // Set completion state
    const completeBtn = taskElement.querySelector('.complete-btn');
    if (task.completed) {
        completeBtn.classList.add('completed');
        taskElement.querySelector('.task-title').classList.add('completed');
        if (task.description) {
            taskElement.querySelector('.task-description').classList.add('completed');
        }
    }
    completeBtn.addEventListener('click', () => toggleComplete(task.id));

    // Set task content
    taskElement.querySelector('.task-title').textContent = task.title;
    
    const descriptionElement = taskElement.querySelector('.task-description');
    if (task.description) {
        descriptionElement.textContent = task.description;
    } else {
        descriptionElement.remove();
    }

    // Set priority badge
    const priorityBadge = taskElement.querySelector('.priority-badge');
    priorityBadge.textContent = task.priority;
    priorityBadge.classList.add(task.priority);

    // Set category badge
    taskElement.querySelector('.category-badge').textContent = task.category;

    // Set due date badge
    const dueDateBadge = taskElement.querySelector('.due-date-badge');
    if (task.dueDate) {
        const { text, isOverdue } = formatDueDate(task.dueDate);
        taskElement.querySelector('.due-text').textContent = text;
        if (isOverdue) {
            dueDateBadge.classList.add('overdue');
        }
    } else {
        dueDateBadge.remove();
    }

    // Add event listeners for edit and delete
    taskElement.querySelector('.edit-btn').addEventListener('click', () => startEdit(taskElement, task));
    taskElement.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    return taskElement;
}

// Update task count and progress bar
function updateProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    
    document.querySelector('.task-count').textContent = 
        `${completedTasks} of ${totalTasks} tasks completed`;
    
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%';
}

// Filter and sort tasks
function getFilteredAndSortedTasks() {
    let filteredTasks = [...tasks];
    
    // Apply filter
    if (currentFilter === 'Active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter === 'Completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (CATEGORIES.includes(currentFilter)) {
        filteredTasks = filteredTasks.filter(task => task.category === currentFilter);
    }

    // Apply sorting
    return filteredTasks.sort((a, b) => {
        if (currentSort === 'priority') {
            const priorityOrder = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (currentSort === 'dueDate') {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else { // created
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
}

// Update the UI
function updateUI() {
    // Update progress
    updateProgress();

    // Clear task list
    taskList.innerHTML = '';

    // Get filtered and sorted tasks
    const filteredTasks = getFilteredAndSortedTasks();

    // Show empty state or render tasks
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-emoji">📝</div>
            <p>No tasks found. Add your first task above!</p>
        `;
        taskList.appendChild(emptyState);
    } else {
        filteredTasks.forEach(task => {
            taskList.appendChild(renderTask(task));
        });
    }

    // Reinitialize Lucide icons
    lucide.createIcons();
}

// Event Listeners
addTaskBtn.addEventListener('click', addTask);

filterButtons.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        updateUI();
    }
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    updateUI();
});

// Initialize app
loadTasks();

