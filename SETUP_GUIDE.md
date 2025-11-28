# AI Story Video Creator - Setup Guide

## Quick Start

### Automated Setup (Recommended)

Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

### Manual Setup

If the automated setup doesn't work, follow these steps:

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

## Step-by-Step Installation

### 1. Start the Database

```bash
docker-compose up -d
```

This will start PostgreSQL on `localhost:5432` with:
- Database: `ai_story_video`
- User: `postgres`
- Password: `postgres`

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Run database migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload
```

The backend API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 3. Frontend Setup

In a new terminal:

```bash
cd frontend

# Create .env file
cp .env.example .env

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Configuration

### API Keys

1. Navigate to the Settings page in the application
2. Configure the following API keys:
   - **ANTHROPIC_API_KEY**: For Claude script generation
   - **OPENAI_API_KEY**: For OpenAI/GPT-4 script generation
   - **LEONARDO_API_KEY**: For Leonardo.ai image generation
   - **STABLE_DIFFUSION_API_KEY**: For Stable Diffusion image generation
   - **MIDJOURNEY_API_KEY**: For Midjourney (if using unofficial API)

All API keys are encrypted before storage using AES encryption.

### Environment Variables

#### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_story_video
SECRET_KEY=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here
STORAGE_PATH=../storage
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
```

## Usage Workflow

### 1. Create a Project

1. Go to the **Projects** page
2. Click "New Project"
3. Enter project name and description
4. Click "Create"

### 2. Generate a Script

1. Go to the **Scripts** page
2. Click "AI Generate" for AI-powered generation or "Manual Script" to write your own
3. For AI generation:
   - Select AI provider (Claude or OpenAI)
   - Choose genre, tone, and length
   - Optionally provide a custom prompt
   - Click "Generate Script"
4. View, edit, or export your script

### 3. Generate Images

1. Go to the **Images** page
2. Click "Generate Images"
3. Select providers (Leonardo.ai, Stable Diffusion, or Midjourney)
4. Either:
   - Enable "Auto-generate prompts from script" and select a script, OR
   - Manually enter image prompts
5. Click "Generate Images"
6. Download individual images or all as a ZIP file

### 4. Voice Overs (Coming Soon)

The Voice Over module is currently a placeholder and will be implemented in future updates.

## Troubleshooting

### Database Connection Issues

If you get database connection errors:

```bash
# Check if PostgreSQL is running
docker-compose ps

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Backend Issues

```bash
# Check if all dependencies are installed
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Check database migrations
alembic current
alembic upgrade head

# View backend logs
# The logs will appear in the terminal where uvicorn is running
```

### Frontend Issues

```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

# Clear browser cache and reload
```

### API Key Issues

- Make sure API keys are configured in the Settings page
- API keys are stored encrypted in the database
- Test API connectivity by generating a script or image

## Development

### Adding New Features

1. **Backend**: Add routes in `backend/app/api/`, models in `backend/app/models/`, services in `backend/app/services/`
2. **Frontend**: Add pages in `frontend/src/pages/`, components in `frontend/src/components/`

### Database Migrations

When you modify models:

```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

### Building for Production

#### Backend

```bash
cd backend
pip install -r requirements.txt
# Set production environment variables
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend

```bash
cd frontend
npm run build
# Serve the 'dist' folder with a web server
```

## Project Structure

```
.
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── core/         # Config, database, security
│   ├── alembic/          # Database migrations
│   └── requirements.txt
├── frontend/             # React frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── package.json
├── storage/              # File storage
│   ├── scripts/
│   ├── voiceovers/
│   └── images/
├── docker-compose.yml    # PostgreSQL setup
└── README.md
```

## Support

For issues or questions:
- Check the troubleshooting section above
- Review API documentation at `http://localhost:8000/docs`
- Check backend logs and frontend console for errors
