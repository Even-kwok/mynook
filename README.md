# Interior AI Studio

An AI-powered interior design studio that transforms your room photos into various creative themes and styles. This application leverages the Gemini API to offer a powerful and intuitive interior redesign and generation experience. Users can combine a primary room photo with multiple style reference images and a text prompt to generate a batch of creatively designed spaces.

## Features

### 🎨 Design Tools
-   **Room Transformation**: Upload a photo of your room (Module 1) to see it redesigned.
-   **Inspiration Images**: Optionally provide style reference photos (Module 2) to guide the AI.
-   **Advanced Text Prompts**: Describe the desired interior style with detailed text prompts.
-   **Prompt Templates**: Get started quickly with a curated list of popular interior design styles.
-   **Batch Generation**: Generate multiple design concepts at once, each combining the room photo with a different inspiration image.
-   **Single Image Generation**: Use just a room photo and a prompt for a single, focused transformation.
-   **Interactive UI**: Modern, responsive interface with image previews, loading states, and error handling.
-   **Result Actions**: Download, regenerate, or view generated designs in full-screen.

### 🔐 User Authentication
-   **Email & Password Login**: Traditional authentication method
-   **Google OAuth Login**: One-click sign-in with Google account ✨ **NEW**
-   **User Profiles**: Automatic profile creation with avatar and name
-   **Persistent Sessions**: Stay logged in across browser sessions

### 💎 Membership System
-   **Free Tier**: 0 credits (new users need to purchase credits)
-   **Pro/Premium/Business**: Enhanced features and credit limits
-   **Credit Management**: Track usage and generation history

## How It Works

1.  **Upload Your Room**: Add the photo of the room you want to transform. This is the main subject.
2.  **(Optional) Add Inspiration**: Add one or more photos that define the style, texture, or composition you're aiming for.
3.  **Describe the Style**: Write a detailed text prompt in the text area, or click on a pre-made style template to auto-fill it.
4.  **Generate**: Click the "Generate" button. The app will process your request, using the Gemini model to combine your room photo with your prompt (and each inspiration image if provided).
5.  **View Results**: Your new interior designs will appear on the right. You can click on them to view them larger, download them, or try generating them again.

## Tech Stack

-   **Frontend**: [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
-   **Backend**: [Supabase](https://supabase.com/) (Authentication, Database, Storage)
-   **AI**: [Google Gemini API](https://ai.google.dev/) (`@google/genai`)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Animation**: [Framer Motion](https://www.framer.com/motion/)
-   **Deployment**: [Vercel](https://vercel.com/)

## Getting Started

To run this project locally, you will need to have Node.js installed and a Google Gemini API key.

### Prerequisites

-   Node.js and npm (or yarn)
-   A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey)
-   A Supabase account and project from [Supabase Dashboard](https://supabase.com/dashboard)
-   (Optional) Google OAuth credentials for social login

### Installation & Setup

1.  **Clone the repository** (or download the source code).

2.  **Install dependencies** by running the following command in the project's root directory:
    ```bash
    npm install
    ```

3.  **Set up environment variables**.
    Create a `.env` file in the project root:
    ```env
    # Google Gemini API
    VITE_GEMINI_API_KEY=your-gemini-api-key
    
    # Supabase Configuration
    VITE_SUPABASE_URL=https://xxxxx.supabase.co
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

4.  **Configure Supabase** (Required for authentication):
    - Run database migrations in `supabase/migrations/`
    - See [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for detailed setup

5.  **Configure Google OAuth** (Optional but recommended):
    - See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for step-by-step guide
    - Or use the quick guide: [Google登录配置快速指南.md](./Google登录配置快速指南.md)

6.  **Start the development server**:
    ```bash
    npm run dev
    ```

7.  Open your browser and navigate to `http://localhost:3000`

## File Structure

Here is an overview of the key files and directories in the project:

```
/
├── components/            # React UI components
│   ├── AdminPage.tsx     # Admin dashboard
│   ├── LoginModal.tsx    # Authentication modal
│   └── ...               # Other components
├── services/             # Business logic services
│   ├── authService.ts    # Authentication & user management
│   ├── geminiService.ts  # AI image generation
│   ├── templateService.ts # Design templates
│   └── ...
├── context/              # React Context providers
│   ├── AuthContext.tsx   # Global auth state
│   └── ...
├── supabase/             # Database & migrations
│   └── migrations/       # SQL migration files
├── config/               # Configuration files
│   └── supabase.ts       # Supabase client setup
├── App.tsx               # Main application
├── index.tsx             # React entry point
└── README.md             # Project documentation
```

## 📚 Documentation

### Getting Started
- **[README.md](./README.md)** - This file
- **[SETUP.md](./SETUP.md)** - Detailed setup instructions

### Authentication & Users
- **[AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md)** - User authentication overview
- **[GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)** - Complete Google login setup guide
- **[Google登录配置快速指南.md](./Google登录配置快速指南.md)** - Quick setup (15 min) 🇨🇳
- **[GOOGLE_LOGIN_TEST_CHECKLIST.md](./GOOGLE_LOGIN_TEST_CHECKLIST.md)** - Testing checklist

### Features & Systems
- **[TEMPLATE_SYSTEM_GUIDE.md](./TEMPLATE_SYSTEM_GUIDE.md)** - Design template management
- **[ADMIN_SYSTEM_GUIDE.md](./ADMIN_SYSTEM_GUIDE.md)** - Admin panel guide
- **[MEMBERSHIP_PERMISSION_GUIDE.md](./MEMBERSHIP_PERMISSION_GUIDE.md)** - Membership tiers

### Deployment
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[VERCEL_DEBUG_GUIDE.md](./VERCEL_DEBUG_GUIDE.md)** - Vercel troubleshooting