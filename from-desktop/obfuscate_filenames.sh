#!/bin/bash

# 1. Validate that an argument was provided
if [ -z "$1" ]; then
    echo "Error: No directory provided."
    echo "Usage: $0 <path_to_directory>"
    exit 1
fi

TARGET_DIR="$1"

# 2. Validate that the argument is actually a directory
if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: '$TARGET_DIR' is not a valid directory."
    exit 1
fi

# 3. Check for uuidgen
if ! command -v uuidgen &> /dev/null; then
    echo "Error: uuidgen tool is required but not found."
    exit 1
fi

# Move into the directory to simplify file operations
cd "$TARGET_DIR" || { echo "Error: Failed to enter directory."; exit 1; }

echo "Renaming files in: $(pwd)"
count=0

# Loop through files
for file in *; do
    # Skip directories and prevent the script from renaming itself 
    # (if the script happens to be inside that folder)
    if [ -d "$file" ] || [ "$file" == "$(basename "$0")" ]; then
        continue
    fi

    # Extract extension
    ext="${file##*.}"

    # Handle files that might not have an extension
    if [ "$file" = "$ext" ]; then
        new_name="$(uuidgen)"
    else
        new_name="$(uuidgen).$ext"
    fi

    # Rename
    mv "$file" "$new_name"
    ((count++))
done

echo "✅ Success. Obfuscated $count files."
