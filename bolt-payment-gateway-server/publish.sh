#!/bin/bash

tag=$1
env=$2 # Argument for environment "production | staging"

if [ $# -eq 0 ]; then
    echo "No tag supplied!"
    exit 1;
fi

# Default environment to production if not specified
if [ -z "$env" ]; then
    env="production"
fi

echo -e "\e[34m"
echo ">>> Building project - Tag: $tag, Environment: $env <<<"
echo -e "\e[0m"

# Determine the build configuration based on the environment
imageName="bolt-payment-gateway-server"

echo -e "\e[34m"
echo ">>> Building Image: $imageName <<<"
echo -e "\e[0m"

if [ "$env" == "staging" ]; then
    echo "Building STAGING environment with debug mode..."
    docker image build -f Dockerfile.debug -t $imageName .
    echo "Created STAGING environment!"
else
    echo "Building PRODUCTION environment with release mode..."
    docker image build -f Dockerfile -t $imageName .
    echo "Created PRODUCTION environment!"
fi

docker tag $imageName southamerica-east1-docker.pkg.dev/smiling-stock-373320/pulseb-containers/$imageName:$tag

echo -e "\e[34m"
echo ">>> Pushing Image <<<"
echo -e "\e[0m"
docker push southamerica-east1-docker.pkg.dev/smiling-stock-373320/pulseb-containers/$imageName:$tag