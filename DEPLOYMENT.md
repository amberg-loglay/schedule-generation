# Deploying Schedule Planner to Render.com

## Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Required Files**: Make sure these files are in your repository:
   - `requirements.txt` (Python dependencies)
   - `render-build.sh` (Custom build script)
   - `package.json` (Node.js dependencies)

## Deployment Steps

### Method 1: Using Render Dashboard (Recommended)

1. **Connect GitHub Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: `schedule-planner`
   - **Environment**: `Node`
   - **Region**: Choose your preferred region
   - **Branch**: `main` (or your main branch)
   - **Root Directory**: Leave empty or set to your app directory

3. **Build & Deploy Settings**:
   - **Build Command**: `chmod +x ./render-build.sh && ./render-build.sh`
   - **Start Command**: `npm start`
   - **Node Version**: `18` (or higher)

4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PYTHON_VERSION`: `3.9`

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for the build to complete (5-10 minutes)

### Method 2: Using render.yaml (Automated)

1. **Push render.yaml**: The `render.yaml` file is already configured
2. **Import Service**: Use "Import from Render.yaml" option in dashboard

## Important Notes

### Data Files Setup

The app requires specific data files to function:

1. **Create data directory** in your app:
   ```
   mkdir -p data
   ```

2. **Add required files**:
   - `label_object_sequenced.json` ✅ (already present)
   - `classification_results_bim_gemini_*.json` ❌ (needs to be added)

3. **Update file paths** in Python scripts to use relative paths

### Environment Configuration

For production, you may need to:

1. **Add environment variables** for any API keys
2. **Configure database connections** if needed
3. **Set up CORS** for your domain

## Troubleshooting

### Common Issues

1. **Build Fails**:
   - Check that `render-build.sh` has execute permissions
   - Verify Python dependencies in `requirements.txt`

2. **Python Script Errors**:
   - Ensure data files are present
   - Check file paths are relative, not absolute

3. **App Crashes on Start**:
   - Check logs in Render dashboard
   - Verify all required files are deployed

### Checking Logs

- Go to Render Dashboard
- Select your service
- Click "Logs" tab to see build and runtime logs

## Post-Deployment

1. **Test the App**: Visit your Render URL
2. **Monitor Performance**: Check Render metrics
3. **Set Up Custom Domain** (optional): Configure DNS in Render settings

## Cost Estimation

- **Free Tier**: Limited hours/month, sleeps after inactivity
- **Starter Plan**: $7/month, always on, better performance
- **Pro Plan**: $25/month, advanced features

## Support

If you encounter issues:
1. Check Render documentation
2. Review build/runtime logs
3. Verify all dependencies are properly configured 