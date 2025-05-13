// Task Manager Application

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskForm = document.getElementById('task-form');
    const tasksContainer = document.getElementById('tasks-container');
    const titleInput = document.getElementById('title');
    const descriptionInput = document.getElementById('description');
    const loadingElement = document.getElementById('loading');
    const noTasksElement = document.getElementById('no-tasks');
    const refreshBtn = document.getElementById('refresh-btn');
    const taskTemplate = document.getElementById('task-template');
    const editModal = new bootstrap.Modal(document.getElementById('edit-modal'));
    const editForm = document.getElementById('edit-form');
    const editIdInput = document.getElementById('edit-id');
    const editTitleInput = document.getElementById('edit-title');
    const editDescriptionInput = document.getElementById('edit-description');
    const editCompletedInput = document.getElementById('edit-completed');
    const saveEditBtn = document.getElementById('save-edit');
    const toast = new bootstrap.Toast(document.getElementById('toast'));
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    // API Endpoints
    const API_URL = '/api/tasks';
    
    // Check database connection
    checkDatabaseConnection();

    // Initial load
    loadTasks();
    
    // Event Listeners
    taskForm.addEventListener('submit', createTask);
    refreshBtn.addEventListener('click', loadTasks);
    saveEditBtn.addEventListener('click', updateTask);
    
    // Functions
    async function checkDatabaseConnection() {
        try {
            const response = await fetch('/health');
            const data = await response.json();
            
            if (data.database !== 'Connected') {
                showNotification(
                    'Database Connection Issue', 
                    'The application is not connected to the MongoDB database. Tasks cannot be saved or retrieved.', 
                    'warning',
                    10000 // longer display time
                );
            }
        } catch (error) {
            console.error('Error checking database connection:', error);
        }
    }
    
    async function loadTasks() {
        try {
            showLoading(true);
            toggleRefreshAnimation(true);
            
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load tasks');
            }
            
            const tasks = await response.json();
            renderTasks(tasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
            showNotification('Error', error.message || 'Failed to load tasks. Please try again.', 'danger');
            noTasksElement.classList.remove('d-none');
        } finally {
            showLoading(false);
            toggleRefreshAnimation(false);
        }
    }
    
    function renderTasks(tasks) {
        // Clear existing tasks except loading and no-tasks elements
        const taskElements = document.querySelectorAll('.task-item');
        taskElements.forEach(el => el.remove());
        
        if (tasks.length === 0) {
            noTasksElement.classList.remove('d-none');
        } else {
            noTasksElement.classList.add('d-none');
            
            tasks.forEach(task => {
                const taskElement = createTaskElement(task);
                loadingElement.insertAdjacentElement('beforebegin', taskElement);
            });
        }
    }
    
    function createTaskElement(task) {
        const clone = document.importNode(taskTemplate.content, true);
        const taskElement = clone.querySelector('.task-item');
        
        taskElement.dataset.id = task._id;
        taskElement.dataset.completed = task.completed;
        
        taskElement.querySelector('.task-title').textContent = task.title;
        taskElement.querySelector('.task-description').textContent = task.description || 'No description';
        
        const date = new Date(task.createdAt);
        taskElement.querySelector('.task-date').textContent = `Created: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        const completeCheckbox = taskElement.querySelector('.task-complete');
        completeCheckbox.checked = task.completed;
        completeCheckbox.addEventListener('change', () => toggleTaskComplete(task._id, completeCheckbox.checked));
        
        taskElement.querySelector('.task-delete').addEventListener('click', () => deleteTask(task._id));
        
        // Add click handler to edit when clicking on the task (not on action buttons)
        taskElement.addEventListener('click', (e) => {
            if (!e.target.closest('.task-actions')) {
                openEditModal(task);
            }
        });
        
        return taskElement;
    }
    
    async function createTask(e) {
        e.preventDefault();
        
        const title = titleInput.value.trim();
        const description = descriptionInput.value.trim();
        
        if (!title) {
            showNotification('Error', 'Task title is required', 'danger');
            return;
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create task');
            }
            
            // Reset form
            taskForm.reset();
            
            // Reload tasks
            loadTasks();
            
            showNotification('Success', 'Task created successfully!', 'success');
        } catch (error) {
            console.error('Error creating task:', error);
            showNotification('Error', error.message || 'Failed to create task. Please try again.', 'danger');
        }
    }
    
    async function toggleTaskComplete(id, completed) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ completed })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update task');
            }
            
            const task = await response.json();
            
            // Update UI
            const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
            taskElement.dataset.completed = task.completed;
            
            showNotification('Success', `Task marked as ${completed ? 'completed' : 'incomplete'}`, 'success');
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Error', error.message || 'Failed to update task. Please try again.', 'danger');
            
            // Reset checkbox to previous state
            const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
            const checkbox = taskElement.querySelector('.task-complete');
            checkbox.checked = !completed;
        }
    }
    
    async function deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) {
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete task');
            }
            
            // Remove task from UI
            const taskElement = document.querySelector(`.task-item[data-id="${id}"]`);
            taskElement.remove();
            
            // Check if there are any tasks left
            if (document.querySelectorAll('.task-item').length === 0) {
                noTasksElement.classList.remove('d-none');
            }
            
            showNotification('Success', 'Task deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting task:', error);
            showNotification('Error', error.message || 'Failed to delete task. Please try again.', 'danger');
        }
    }
    
    function openEditModal(task) {
        editIdInput.value = task._id;
        editTitleInput.value = task.title;
        editDescriptionInput.value = task.description || '';
        editCompletedInput.checked = task.completed;
        
        editModal.show();
    }
    
    async function updateTask() {
        const id = editIdInput.value;
        const title = editTitleInput.value.trim();
        const description = editDescriptionInput.value.trim();
        const completed = editCompletedInput.checked;
        
        if (!title) {
            showNotification('Error', 'Task title is required', 'danger');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, description, completed })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update task');
            }
            
            // Close modal
            editModal.hide();
            
            // Reload tasks to reflect changes
            loadTasks();
            
            showNotification('Success', 'Task updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Error', error.message || 'Failed to update task. Please try again.', 'danger');
        }
    }
    
    function showLoading(show) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
    
    function toggleRefreshAnimation(animate) {
        const icon = refreshBtn.querySelector('.fa-sync');
        if (animate) {
            icon.classList.add('rotating');
        } else {
            icon.classList.remove('rotating');
        }
    }
    
    function showNotification(title, message, type = 'primary', duration = 5000) {
        // Set title and message
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        
        // Set toast color based on type
        const toastElement = document.getElementById('toast');
        toastElement.className = 'toast';
        toastElement.classList.add(`text-bg-${type}`);
        
        // Create new toast instance with custom duration
        const toastInstance = new bootstrap.Toast(toastElement, {
            delay: duration
        });
        
        // Show toast
        toastInstance.show();
    }
}); 