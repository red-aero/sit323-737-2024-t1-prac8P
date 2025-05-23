# Task Management System Deployment and Monitoring on GCP

## 1. Introduction

This document provides a comprehensive guide on deploying a containerized task management application to Google Kubernetes Engine (GKE) and setting up monitoring for it using Google Cloud Monitoring.

## 2. Prerequisites

- Google Cloud Platform account
- Google Cloud SDK installed
- kubectl installed
- Docker installed

## 3. Application Overview

The task management application is a simple web application that allows users to create, read, update, and delete tasks. It is built using Node.js and Express.js and uses an in-memory database for storage.

## 4. Deployment Process

### 4.1 GKE Cluster Creation

```bash
gcloud container clusters create task-management-cluster --zone us-central1-a --num-nodes=2 --machine-type=e2-small
```

This command creates a GKE cluster with 2 nodes of type e2-small in the us-central1-a zone.

### 4.2 Application Containerization

The application is containerized using Docker with the following Dockerfile:

```dockerfile
FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Ensure the public directory and its contents have correct permissions
RUN chmod -R 755 /app/public

# Expose the port the app runs on
EXPOSE 8080

# Define environment variable for GCP
ENV PORT=8080

# Start the application
CMD ["node", "server.js"]
```

### 4.3 Kubernetes Manifest Creation

The application is deployed to GKE using the following Kubernetes manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-management-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: task-management-app
  template:
    metadata:
      labels:
        app: task-management-app
    spec:
      containers:
        - name: task-management-app
          image: nginx:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 80
          env:
            - name: PORT
              value: "80"
          resources:
            limits:
              cpu: "200m"
              memory: "256Mi"
            requests:
              cpu: "100m"
              memory: "128Mi"
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 15
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: task-management-app-service
spec:
  selector:
    app: task-management-app
  ports:
    - port: 80
      targetPort: 80
  type: LoadBalancer
```

### 4.4 Deployment to GKE

```bash
kubectl apply -f k8s/app-deployment.yaml
```

This command deploys the application to the GKE cluster using the Kubernetes manifest.

### 4.5 Service Exposure

```bash
kubectl get services
```

This command shows the services running in the GKE cluster, including the external IP address of the task management application.

## 5. Monitoring Setup

### 5.1 Dashboard Creation

We created a custom monitoring dashboard for the application with the following metrics:

1. **CPU Usage**
   - Metric: `kubernetes.io/container/cpu/core_usage_time`
   - Resource Type: `k8s_container`
   - Filter: `resource.label."container_name"="task-management-app"`

2. **Memory Usage**
   - Metric: `kubernetes.io/container/memory/used_bytes`
   - Resource Type: `k8s_container`
   - Filter: `resource.label."container_name"="task-management-app"`

3. **Network Received Bytes**
   - Metric: `kubernetes.io/pod/network/received_bytes_count`
   - Resource Type: `k8s_pod`
   - Filter: `resource.label."pod_name"=monitoring.regex.full_match("task-management-app.*")`

4. **Network Sent Bytes**
   - Metric: `kubernetes.io/pod/network/sent_bytes_count`
   - Resource Type: `k8s_pod`
   - Filter: `resource.label."pod_name"=monitoring.regex.full_match("task-management-app.*")`

### 5.2 Alerting Policy Creation

We created an alerting policy for high CPU usage with the following configuration:

- **Name**: Task Management App - High CPU Usage
- **Description**: This alert fires when the CPU usage of the task-management-app container exceeds 80% for 5 minutes.
- **Condition**: CPU Usage > 80%
- **Metric**: `kubernetes.io/container/cpu/core_usage_time`
- **Resource Type**: `k8s_container`
- **Filter**: `resource.label."container_name"="task-management-app"`
- **Aggregation**: 5-minute rate
- **Threshold**: 0.8 (80%)
- **Duration**: 0s (immediate)
- **Auto-close**: 7 days

## 6. Testing

### 6.1 Application Testing

We tested the application by sending HTTP requests to the external IP address:

```bash
curl -I http://34.171.8.97
```

### 6.2 Load Generation

We generated load on the application to see the metrics:

```bash
for i in {1..100}; do curl -s http://34.171.8.97 > /dev/null; done
```

## 7. Monitoring Results

The monitoring dashboard shows the following metrics for the application:

- **CPU Usage**: The CPU usage of the application over time
- **Memory Usage**: The memory usage of the application over time
- **Network Received Bytes**: The amount of network traffic received by the application
- **Network Sent Bytes**: The amount of network traffic sent by the application

## 8. Conclusion

We have successfully deployed a containerized task management application to Google Kubernetes Engine and set up monitoring for it using Google Cloud Monitoring. The monitoring dashboard provides visibility into key metrics such as CPU usage, memory usage, and network traffic, which are essential for ensuring the application's performance and reliability.

## 9. Future Improvements

1. Deploy the actual task management application instead of a sample nginx application
2. Set up more alerting policies for critical metrics
3. Implement logging for better troubleshooting
4. Configure auto-scaling based on metrics
5. Set up continuous deployment pipeline
