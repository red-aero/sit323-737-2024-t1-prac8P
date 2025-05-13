#!/bin/bash

# Ensure script exits on error
set -e

echo "=== Starting Cloud Native App with MongoDB Deployment ==="

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed. Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

# Check Kubernetes cluster connection
echo "Checking Kubernetes cluster connection..."
kubectl cluster-info || { echo "Error: Cannot connect to Kubernetes cluster"; exit 1; }

# Create Kubernetes namespace (optional)
# kubectl create namespace cloud-app || true
# kubectl config set-context --current --namespace=cloud-app

# 1. Deploy MongoDB
echo "1. Deploying MongoDB database..."

echo "Creating MongoDB Secret..."
kubectl apply -f k8s/mongodb-secret.yaml

echo "Creating MongoDB ConfigMap..."
kubectl apply -f k8s/mongodb-configmap.yaml

echo "Creating MongoDB persistent volumes..."
kubectl apply -f k8s/mongodb-pv.yaml

echo "Deploying MongoDB..."
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB to start
echo "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=120s || { echo "MongoDB is not ready, check logs: kubectl logs -l app=mongodb"; exit 1; }

# 2. Build and deploy application
echo "2. Building application container..."
docker build -t cloud-native-app:latest .

# Confirm how user wants to handle image
read -p "Do you need to push to a remote container registry? (y/n): " push_image

if [ "$push_image" = "y" ]; then
    read -p "Enter Docker Hub username: " docker_username
    echo "Tagging image..."
    docker tag cloud-native-app:latest $docker_username/cloud-native-app:latest
    
    echo "Pushing image to Docker Hub..."
    docker push $docker_username/cloud-native-app:latest
    
    # Update image in application deployment config
    echo "Updating application deployment config..."
    sed -i "s|image: cloud-native-app:latest|image: $docker_username/cloud-native-app:latest|g" k8s/app-deployment.yaml
fi

echo "3. Deploying application..."
kubectl apply -f k8s/app-deployment.yaml

# Wait for application to start
echo "Waiting for application to be ready..."
kubectl wait --for=condition=ready pod -l app=cloud-native-app --timeout=120s || { echo "Application is not ready, check logs: kubectl logs -l app=cloud-native-app"; exit 1; }

# Get application access info
echo "=== Deployment Complete ==="
echo "MongoDB successfully deployed"

echo "Application access information:"
kubectl get svc cloud-native-app

# If using Minikube, provide additional access method
if command -v minikube &> /dev/null; then
    echo "To access application in Minikube:"
    echo "Run: minikube service cloud-native-app"
fi

echo "=== Deployment Script Completed ===" 