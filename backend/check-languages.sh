#!/bin/bash
# check-languages.sh - Script to verify language support

echo "Checking installed language support..."

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js installed: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check Python
if command -v python3 &> /dev/null; then
    echo "✅ Python installed: $(python3 --version)"
elif command -v python &> /dev/null; then
    echo "✅ Python installed: $(python --version)"
else
    echo "❌ Python not found"
fi

# Check Java
if command -v java &> /dev/null; then
    echo "✅ Java installed: $(java -version 2>&1 | head -n 1)"
else
    echo "❌ Java not found"
fi

# Check C compiler (GCC)
if command -v gcc &> /dev/null; then
    echo "✅ C compiler installed: $(gcc --version | head -n 1)"
else
    echo "❌ C compiler not found"
fi

# Check C++ compiler (G++)
if command -v g++ &> /dev/null; then
    echo "✅ C++ compiler installed: $(g++ --version | head -n 1)"
else
    echo "❌ C++ compiler not found"
fi

echo "Language check complete."