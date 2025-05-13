// MongoDB Setup Script
// This script initializes the local MongoDB database for the SIT323 Task Management System

db = db.getSiblingDB('taskdb');

// Drop collections if they already exist (optional, for clean setup)
db.tasks.drop();

// Create indexes for better performance
db.tasks.createIndex({ "title": 1 });
db.tasks.createIndex({ "completed": 1 });
db.tasks.createIndex({ "createdAt": -1 });

// Insert some sample tasks for SIT323
db.tasks.insertMany([
    {
        title: "Task 1: Kubernetes Cluster Setup",
        description: "Set up a Kubernetes cluster using minikube or Docker Desktop for local development.",
        completed: true,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 5))
    },
    {
        title: "Task 2: MongoDB Integration",
        description: "Configure MongoDB deployment in Kubernetes with persistent storage and proper authentication.",
        completed: true,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 3))
    },
    {
        title: "Task 3: Application Deployment",
        description: "Deploy the Node.js application to Kubernetes and ensure it connects to MongoDB properly.",
        completed: false,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1))
    },
    {
        title: "Task 4: Implement Backup Strategy",
        description: "Create a backup and recovery plan for the MongoDB database in Kubernetes.",
        completed: false,
        createdAt: new Date()
    }
]);

// Print confirmation
print("MongoDB setup completed successfully!");
print("Created database: taskdb");
print("Created collection: tasks");
print("Inserted sample tasks: " + db.tasks.count() + " documents");