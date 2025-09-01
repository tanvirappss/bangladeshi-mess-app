@echo off
echo ========================================
echo  Bangladeshi Mess App - GitHub Setup
echo ========================================
echo.

echo This script will help you connect your project to GitHub.
echo.

echo Step 1: Create a new repository on GitHub
echo - Go to https://github.com/new
echo - Repository name: bangladeshi-mess-app
echo - Description: A complete mess management system for Bangladeshi bachelor mess
echo - Make it Public or Private
echo - DO NOT initialize with README, .gitignore, or license
echo - Click "Create repository"
echo.

set /p username="Enter your GitHub username: "
set /p reponame="Enter repository name (default: bangladeshi-mess-app): "

if "%reponame%"=="" set reponame=bangladeshi-mess-app

echo.
echo Step 2: Connecting to GitHub...
echo.

git remote add origin https://github.com/%username%/%reponame%.git
if %errorlevel% neq 0 (
    echo Error: Failed to add remote. Repository might already be connected.
    git remote set-url origin https://github.com/%username%/%reponame%.git
)

git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo  SUCCESS! 
    echo ========================================
    echo Your project is now connected to GitHub!
    echo Repository URL: https://github.com/%username%/%reponame%
    echo.
    echo Next steps:
    echo 1. Set up Supabase credentials in .env file
    echo 2. Deploy to Vercel or Netlify (see DEPLOYMENT.md)
    echo 3. Share the repository with your team
    echo.
) else (
    echo.
    echo ========================================
    echo  ERROR!
    echo ========================================
    echo Failed to push to GitHub. Please check:
    echo 1. Repository exists on GitHub
    echo 2. You have proper permissions
    echo 3. GitHub credentials are set up
    echo.
)

pause