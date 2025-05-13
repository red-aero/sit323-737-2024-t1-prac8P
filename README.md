# SIT323 Task Management System with MongoDB Integration

This repository contains a cloud-native task management application with MongoDB database integration, built for SIT323 Practical 7P. The application demonstrates how to integrate a database into a containerized microservice application using Docker and Kubernetes.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Deployment Instructions](#deployment-instructions)
6. [MongoDB Integration](#mongodb-integration)
7. [Persistent Storage Configuration](#persistent-storage-configuration)
8. [User Management](#user-management)
9. [Backup and Recovery](#backup-and-recovery)
10. [Monitoring](#monitoring)
11. [Troubleshooting](#troubleshooting)

## Overview

This project implements a task management system with the following features:

- MongoDB database integration for data persistence
- Containerization using Docker
- Kubernetes deployment with proper configuration
- Persistent storage for MongoDB data
- User authentication and security
- CRUD operations for task management
- Backup and recovery procedures
- Monitoring capabilities

## Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (Minikube, Docker Desktop, or cloud provider)
- kubectl command-line tool
- Node.js (for local development only)
- MongoDB (for local development only)

## Project Structure

```
├── server.js                  # Application entry point with MongoDB connection
├── package.json               # Project dependencies
├── Dockerfile                 # For building application container
├── docker-compose.yml         # For local development environment
├── setup-mongodb.js           # MongoDB initialization script
├── setup-mongodb.bat          # Windows script to set up MongoDB
├── setup-mongodb.sh           # Linux/Mac script to set up MongoDB
├── deploy-kubernetes.sh       # Kubernetes deployment script
├── public/                    # Frontend static files
│   ├── index.html             # Main HTML page
│   ├── css/                   # Style files
│   └── js/                    # JavaScript files
└── k8s/                       # Kubernetes configuration files
    ├── mongodb-secret.yaml    # MongoDB credentials
    ├── mongodb-configmap.yaml # MongoDB configuration
    ├── mongodb-init-configmap.yaml # MongoDB initialization script
    ├── mongodb-pv.yaml        # MongoDB persistent volume setup
    ├── mongodb-deployment.yaml# MongoDB deployment configuration
    └── app-deployment.yaml    # Application deployment configuration
```

## Step-by-Step Implementation

### 1. MongoDB Installation in Kubernetes

1. **Create MongoDB Secret for credentials**:

   ```bash
   kubectl apply -f k8s/mongodb-secret.yaml
   ```

2. **Create MongoDB ConfigMap for configuration**:

   ```bash
   kubectl apply -f k8s/mongodb-configmap.yaml
   ```

3. **Create MongoDB initialization script ConfigMap**:

   ```bash
   kubectl apply -f k8s/mongodb-init-configmap.yaml
   ```

4. **Set up Persistent Volume and Claim**:

   ```bash
   kubectl apply -f k8s/mongodb-pv.yaml
   ```

5. **Deploy MongoDB**:

   ```bash
   kubectl apply -f k8s/mongodb-deployment.yaml
   ```

6. **Verify MongoDB deployment**:
   ```bash
   kubectl get pods -l app=mongodb
   kubectl logs -l app=mongodb
   ```

### 2. Application Configuration

1. **Configure the application to connect to MongoDB**:

   - The application uses the MongoDB connection string from environment variables
   - In Kubernetes, this is set in the app-deployment.yaml file
   - For local development, it can be set in a .env file or docker-compose.yml

2. **Deploy the application**:

   ```bash
   kubectl apply -f k8s/app-deployment.yaml
   ```

3. **Verify application deployment**:
   ```bash
   kubectl get pods -l app=cloud-native-app
   kubectl logs -l app=cloud-native-app
   ```

## Deployment Instructions

### Docker Compose Deployment (Local Development)

1. **Clone the repository**:

   ```bash
   git clone https://github.com/username/sit323-737-2024-t1-prac7p.git
   cd sit323-737-2024-t1-prac7p
   ```

2. **Deploy using Docker Compose**:

   ```bash
   docker compose up -d
   ```

3. **Access the application**:
   - Open your browser and navigate to: http://localhost:3000

### Kubernetes Deployment

1. **Apply all Kubernetes configuration files**:

   ```bash
   # Use the deployment script
   ./deploy-kubernetes.sh

   # Or apply files manually
   kubectl apply -f k8s/mongodb-secret.yaml
   kubectl apply -f k8s/mongodb-configmap.yaml
   kubectl apply -f k8s/mongodb-init-configmap.yaml
   kubectl apply -f k8s/mongodb-pv.yaml
   kubectl apply -f k8s/mongodb-deployment.yaml
   kubectl apply -f k8s/app-deployment.yaml
   ```

2. **Access the application**:

   ```bash
   # If using LoadBalancer
   kubectl get svc cloud-native-app

   # If using port-forwarding
   kubectl port-forward svc/cloud-native-app 8080:3000
   # Then access: http://localhost:8080
   ```

## MongoDB Integration

### MongoDB Configuration

The MongoDB database is configured with:

1. **Authentication**: Username/password authentication stored in Kubernetes Secret
2. **Database Initialization**: Automatic creation of database, user, and sample data
3. **Connection from Application**: Using Mongoose ODM with connection retry logic

### Database Schema

The primary collection in the database is `tasks` with the following schema:

```javascript
{
  _id: ObjectId,           // Automatically generated unique identifier
  title: String,           // Task title
  description: String,     // Task description
  completed: Boolean,      // Task completion status
  createdAt: Date          // Task creation timestamp
}
```

## Persistent Storage Configuration

### Persistent Volume (PV)

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mongodb-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data"
```

### Persistent Volume Claim (PVC)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

## User Management

### MongoDB User Creation

The MongoDB initialization script creates two types of users:

1. **Root User**: For administrative tasks

   - Username: admin
   - Stored in Kubernetes Secret

2. **Application User**: For application access
   - Username: app_user
   - Has readWrite permissions on the taskdb database
   - Created during initialization

## Backup and Recovery

### Backup Procedures

```bash
# Create a backup directory
mkdir -p backup

# Backup the MongoDB database
docker exec sit323-737-2024-t1-prac7p-mongodb-1 mongodump --out=/tmp/backup
docker cp sit323-737-2024-t1-prac7p-mongodb-1:/tmp/backup ./backup

# For Kubernetes
kubectl exec -it $(kubectl get pods -l app=mongodb -o jsonpath='{.items[0].metadata.name}') -- mongodump --out=/tmp/backup
kubectl cp $(kubectl get pods -l app=mongodb -o jsonpath='{.items[0].metadata.name}'):/tmp/backup ./backup
```

### Recovery Procedures

```bash
# Copy backup to MongoDB container
docker cp ./backup sit323-737-2024-t1-prac7p-mongodb-1:/tmp/

# Restore the database
docker exec sit323-737-2024-t1-prac7p-mongodb-1 mongorestore --drop /tmp/backup

# For Kubernetes
kubectl cp ./backup $(kubectl get pods -l app=mongodb -o jsonpath='{.items[0].metadata.name}'):/tmp/backup
kubectl exec -it $(kubectl get pods -l app=mongodb -o jsonpath='{.items[0].metadata.name}') -- mongorestore --drop /tmp/backup
```

## Monitoring

### Basic Monitoring Commands

```bash
# Check MongoDB status
docker exec sit323-737-2024-t1-prac7p-mongodb-1 mongo --eval "db.serverStatus()"

# Check database statistics
docker exec sit323-737-2024-t1-prac7p-mongodb-1 mongo --eval "db.stats()"

# Check collection statistics
docker exec sit323-737-2024-t1-prac7p-mongodb-1 mongo taskdb --eval "db.tasks.stats()"

# For Kubernetes
kubectl exec -it $(kubectl get pods -l app=mongodb -o jsonpath='{.items[0].metadata.name}') -- mongo --eval "db.serverStatus()"
```

### Using MongoDB Compass

MongoDB Compass provides a graphical interface for monitoring and managing MongoDB:

1. Download MongoDB Compass from: https://www.mongodb.com/products/compass
2. Connect to your MongoDB instance:
   - For Docker Compose: `mongodb://localhost:27017`
   - For Kubernetes (with port-forwarding): `mongodb://localhost:27017`

## Troubleshooting

### Common Issues and Solutions

#### MongoDB Connection Issues

**Issue**: Application cannot connect to MongoDB
**Solution**:

- Verify MongoDB container is running: `docker ps` or `kubectl get pods`
- Check MongoDB logs: `docker logs sit323-737-2024-t1-prac7p-mongodb-1` or `kubectl logs -l app=mongodb`
- Ensure connection string is correct in the application

#### Data Persistence Issues

**Issue**: Data is lost after container restart
**Solution**:

- Verify volume configuration in docker-compose.yml
- Check that Persistent Volume is correctly configured in Kubernetes

### Diagnostic Commands

```bash
# Check application logs
docker logs sit323-737-2024-t1-prac7p-app-1

# Check MongoDB logs
docker logs sit323-737-2024-t1-prac7p-mongodb-1

# Check MongoDB connection
curl http://localhost:3000/health
```

## Conclusion

This documentation provides comprehensive instructions for deploying, managing, and maintaining the SIT323 Task Management System with MongoDB integration. By following these steps, you can successfully implement a cloud-native application with database integration, meeting all the requirements specified in the SIT323 tasksheet.
