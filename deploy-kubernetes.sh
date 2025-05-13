#!/bin/bash

# Kubernetes Deployment Script for MongoDB and Cloud Native Application

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed or not in your PATH."
    exit 1
fi

# Check if Kubernetes cluster is accessible
echo "Checking Kubernetes cluster connection..."
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster."
    exit 1
fi

# Deploy MongoDB
echo "Step 1: Deploying MongoDB to Kubernetes..."
kubectl apply -f k8s/mongodb-configmap.yaml
kubectl apply -f k8s/mongodb-secret.yaml
kubectl apply -f k8s/mongodb-init-configmap.yaml
kubectl apply -f k8s/mongodb-pv.yaml
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB to be ready
echo "Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongodb --timeout=120s
if [ $? -ne 0 ]; then
    echo "MongoDB deployment timed out. Check logs with: kubectl logs -l app=mongodb"
    exit 1
fi

# Build and deploy application
echo "Step 2: Building application container..."
docker build -t cloud-native-app:latest .

# Ask if user wants to push to a remote registry
read -p "Push to a remote container registry? (y/n): " push_image

if [ "$push_image" = "y" ]; then
    read -p "Enter Docker Hub username: " docker_username
    docker tag cloud-native-app:latest $docker_username/cloud-native-app:latest
    docker push $docker_username/cloud-native-app:latest
    sed -i "s|image: cloud-native-app:latest|image: $docker_username/cloud-native-app:latest|g" k8s/app-deployment.yaml
fi

# Deploy application
echo "Deploying application to Kubernetes..."
kubectl apply -f k8s/app-deployment.yaml

# Wait for application to be ready
echo "Waiting for application to be ready..."
kubectl wait --for=condition=ready pod -l app=cloud-native-app --timeout=120s
if [ $? -ne 0 ]; then
    echo "Application deployment timed out. Check logs with: kubectl logs -l app=cloud-native-app"
    exit 1
fi

# Get application access information
echo "Getting application access information..."
if kubectl get svc cloud-native-app -o jsonpath='{.spec.type}' | grep -q "LoadBalancer"; then
    echo "Access URL: http://$(kubectl get svc cloud-native-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}'):$(kubectl get svc cloud-native-app -o jsonpath='{.spec.ports[0].port}')"
else
    echo "To access the application: kubectl port-forward svc/cloud-native-app 8080:80"
    echo "Then access: http://localhost:8080"
fi

echo "Deployment completed successfully!"
