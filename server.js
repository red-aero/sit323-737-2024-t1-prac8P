const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Improved MongoDB connection with retry logic
const connectWithRetry = async (retries = 5, interval = 5000) => {
  // Use environment variable for MongoDB URI or default to local instance
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to MongoDB (Attempt ${i + 1}/${retries})...`);
      const conn = await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`MongoDB connected successfully: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);

      if (i < retries - 1) {
        console.log(`Retrying in ${interval / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      } else {
        console.error('Failed to connect to MongoDB after multiple attempts');
      }
    }
  }
};

// Define task model
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please enter a task title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.model('Task', taskSchema);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Task CRUD operations with better error handling
app.get('/api/tasks', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(500).json({ message: 'Database connection is not established. Please try again later.' });
    }

    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks. Please try again.' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(500).json({ message: 'Database connection is not established. Please try again later.' });
    }

    if (!req.body.title) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: 'Failed to create task. Please try again.' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(500).json({ message: 'Database connection is not established. Please try again later.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Failed to fetch task. Please try again.' });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(500).json({ message: 'Database connection is not established. Please try again later.' });
    }

    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: 'Failed to update task. Please try again.' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    if (!mongoose.connection.readyState) {
      return res.status(500).json({ message: 'Database connection is not established. Please try again later.' });
    }

    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task. Please try again.' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState ? 'Connected' : 'Disconnected';
  res.status(200).json({
    status: 'UP',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Connect to database and start server
connectWithRetry().finally(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});