# MyNook.AI Setup Guide

## Backend API Configuration

This project uses Vercel Serverless Functions to securely call the Gemini API.

### Prerequisites

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Create API Key"
   - Copy your API key

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create a `.env` file in the project root (this file is gitignored):
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

### Vercel Deployment Setup

1. **Go to your Vercel Dashboard**
   - Navigate to your project
   - Go to **Settings** → **Environment Variables**

2. **Add the following environment variable:**
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
   - **Environments:** Production, Preview, Development (check all)

3. **Redeploy**
   - After adding the environment variable, trigger a new deployment
   - The API will now work correctly

### API Endpoints

The application uses two serverless functions:

- **`/api/generate-text`** - Generates text responses from AI advisors
- **`/api/generate-image`** - Generates design images

### Security

✅ API keys are stored server-side only  
✅ Never exposed to the client  
✅ All API calls go through backend functions

### Troubleshooting

**Error: "API key not configured"**
- Make sure `GEMINI_API_KEY` is set in Vercel environment variables
- Redeploy after adding environment variables

**Error: "Failed to fetch"**
- Check if the API functions are deployed correctly
- Verify the API key is valid
- Check Vercel function logs for detailed errors

