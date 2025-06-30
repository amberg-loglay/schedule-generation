@echo off
echo Setting up Construction Schedule Planner...

REM Install dependencies
echo Installing Node.js dependencies...
npm install

REM Create tsconfig.json if it doesn't exist
if not exist tsconfig.json (
    echo Creating tsconfig.json...
    echo {> tsconfig.json
    echo   "compilerOptions": {>> tsconfig.json
    echo     "target": "es5",>> tsconfig.json
    echo     "lib": ["dom", "dom.iterable", "esnext"],>> tsconfig.json
    echo     "allowJs": true,>> tsconfig.json
    echo     "skipLibCheck": true,>> tsconfig.json
    echo     "strict": true,>> tsconfig.json
    echo     "forceConsistentCasingInFileNames": true,>> tsconfig.json
    echo     "noEmit": true,>> tsconfig.json
    echo     "esModuleInterop": true,>> tsconfig.json
    echo     "module": "esnext",>> tsconfig.json
    echo     "moduleResolution": "node",>> tsconfig.json
    echo     "resolveJsonModule": true,>> tsconfig.json
    echo     "isolatedModules": true,>> tsconfig.json
    echo     "jsx": "preserve",>> tsconfig.json
    echo     "incremental": true>> tsconfig.json
    echo   },>> tsconfig.json
    echo   "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],>> tsconfig.json
    echo   "exclude": ["node_modules"]>> tsconfig.json
    echo }>> tsconfig.json
)

REM Create next.config.js if it doesn't exist
if not exist next.config.js (
    echo Creating next.config.js...
    echo module.exports = {> next.config.js
    echo   reactStrictMode: true,>> next.config.js
    echo }>> next.config.js
)

REM Create a basic .gitignore
if not exist .gitignore (
    echo Creating .gitignore...
    echo node_modules/> .gitignore
    echo .next/>> .gitignore
    echo out/>> .gitignore
    echo build/>> .gitignore
    echo .DS_Store>> .gitignore
    echo *.pem>> .gitignore
    echo npm-debug.log*>> .gitignore
    echo yarn-debug.log*>> .gitignore
    echo yarn-error.log*>> .gitignore
    echo .env*.local>> .gitignore
    echo .vercel>> .gitignore
    echo *.tsbuildinfo>> .gitignore
    echo next-env.d.ts>> .gitignore
)

echo Setup complete!
echo.
echo To start the development server, run:
echo npm run dev
echo.
pause 