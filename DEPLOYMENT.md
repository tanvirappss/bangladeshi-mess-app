# Deployment Guide

## GitHub Repository Setup

### Option 1: Create New Repository on GitHub (Recommended)

1. **Go to GitHub.com and create a new repository:**
   - Click "New repository" or go to https://github.com/new
   - Repository name: `bangladeshi-mess-app`
   - Description: `A complete mess management system for Bangladeshi bachelor mess`
   - Make it Public or Private (your choice)
   - **DO NOT** initialize with README, .gitignore, or license (we already have them)
   - Click "Create repository"

2. **Connect your local repository to GitHub:**
   ```bash
   # Add the remote repository (replace 'yourusername' with your GitHub username)
   git remote add origin https://github.com/yourusername/bangladeshi-mess-app.git
   
   # Rename main branch to 'main' (GitHub default)
   git branch -M main
   
   # Push to GitHub
   git push -u origin main
   ```

### Option 2: Push to Existing Repository

If you already have a repository:
```bash
git remote add origin https://github.com/yourusername/your-repo-name.git
git branch -M main
git push -u origin main
```

## Environment Setup for Collaborators

When someone clones the repository:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/bangladeshi-mess-app.git
   cd bangladeshi-mess-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```

4. **Edit .env file with your Supabase credentials:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

## Deployment Options

### 1. Vercel (Recommended for React + Supabase)

1. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Import your repository
   - Add environment variables in Vercel dashboard

2. **Configure environment variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

3. **Deploy:**
   - Vercel will automatically deploy on every push to main branch

### 2. Netlify

1. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Import your repository

2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add environment variables:**
   - Go to Site settings → Environment variables
   - Add your Supabase credentials

### 3. GitHub Pages (Static Hosting)

1. **Install gh-pages:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json:**
   ```json
   {
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/bangladeshi-mess-app"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## Production Configuration

### Supabase Production Setup

1. **Production Database:**
   - Use a separate Supabase project for production
   - Enable RLS and proper security policies
   - Set up proper authentication providers

2. **Environment Variables:**
   ```env
   # Production environment
   VITE_SUPABASE_URL=https://your-prod-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_prod_anon_key
   ```

### Performance Optimization

The app is already optimized with:
- ✅ Code splitting with React Router
- ✅ Tree shaking with Vite
- ✅ Optimized bundle size
- ✅ Lazy loading components
- ✅ Efficient state management

## Continuous Integration/Deployment (CI/CD)

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

## Security Considerations

1. **Never commit .env files** (already in .gitignore)
2. **Use different Supabase projects** for development and production
3. **Enable RLS** on all Supabase tables
4. **Regular security updates** for dependencies
5. **Proper authentication** setup in Supabase

## Repository Management

### Branch Protection (Recommended)

1. Go to repository Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Restrict pushes that create files larger than 100MB

### Collaborator Guidelines

1. **Fork and Pull Request workflow** for contributions
2. **Code review** before merging
3. **Test locally** before pushing
4. **Follow commit message conventions**

## Support

- 📧 Create issues in the GitHub repository for bugs
- 📖 Check the main README.md for usage instructions
- 🔧 Ensure Supabase credentials are correctly configured

---

**Ready for deployment! 🚀**