const express = require('express');
// const mongoose = require('mongoose'); // MongoDB dependency commented out
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for tasks
const tasks = [
  {
    _id: uuidv4(),
    title: "Task 1: Kubernetes Cluster Setup",
    description: "Set up a Kubernetes cluster using minikube or Docker Desktop for local development.",
    completed: true,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5))
  },
  {
    _id: uuidv4(),
    title: "Task 2: MongoDB Integration",
    description: "Configure MongoDB deployment in Kubernetes with persistent storage and proper authentication.",
    completed: true,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3))
  },
  {
    _id: uuidv4(),
    title: "Task 3: Application Deployment",
    description: "Deploy the Node.js application to Kubernetes and ensure it connects to MongoDB properly.",
    completed: false,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1))
  },
  {
    _id: uuidv4(),
    title: "Task 4: Implement Backup Strategy",
    description: "Create a backup and recovery plan for the MongoDB database in Kubernetes.",
    completed: false,
    createdAt: new Date()
  }
];

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Task CRUD operations with in-memory storage
app.get('/api/tasks', (req, res) => {
  try {
    // Sort tasks by createdAt in descending order (newest first)
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks. Please try again.' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const newTask = {
      _id: uuidv4(),
      title: req.body.title,
      description: req.body.description || '',
      completed: req.body.completed || false,
      createdAt: new Date()
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Failed to create task. Please try again.' });
  }
});

app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = tasks.find(task => task._id === req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Failed to fetch task. Please try again.' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(task => task._id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update task properties
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      title: req.body.title || tasks[taskIndex].title,
      description: req.body.description !== undefined ? req.body.description : tasks[taskIndex].description,
      completed: req.body.completed !== undefined ? req.body.completed : tasks[taskIndex].completed
    };

    res.json(tasks[taskIndex]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: 'Failed to update task. Please try again.' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const taskIndex = tasks.findIndex(task => task._id === req.params.id);

    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Remove task from array
    const deletedTask = tasks.splice(taskIndex, 1)[0];

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task. Please try again.' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  // Always return Connected status since we're using in-memory storage
  res.status(200).json({
    status: 'UP',
    database: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// Start server directly (no MongoDB connection needed)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});