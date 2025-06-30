#!/bin/bash

# Install dependencies
npm install

# Create tsconfig.json if it doesn't exist
if [ ! -f tsconfig.json ]; then
  echo '{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}' > tsconfig.json
fi

# Create next.config.js if it doesn't exist
if [ ! -f next.config.js ]; then
  echo 'module.exports = {
  reactStrictMode: true,
}' > next.config.js
fi

# Create a basic .gitignore
if [ ! -f .gitignore ]; then
  echo 'node_modules/
.next/
out/
build/
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env*.local
.vercel
*.tsbuildinfo
next-env.d.ts' > .gitignore
fi

# Make the script executable
chmod +x setup.sh 