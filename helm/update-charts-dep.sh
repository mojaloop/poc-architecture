#!/bin/bash

# Function to check the last command's result exited with a value of 0, otherwise the script will exit with a 1
function checkCommandResult () {
    if [ $? -eq 0 ]; then
        echo ""
    else
        echo "Command failed...exiting. Please fix me!";
        exit 1
    fi
}

echo "Removing old charts..."
find ./ -name "charts"| xargs rm -Rf

# echo "Updating ML API Adapter..."
# helm package -u -d ./repo ./ml-api-adapter
# checkCommandResult

echo "Updating POC Architecture..."
helm dep up ./poc-architecture
checkCommandResult
