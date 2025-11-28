# YouTube AI Story Video Creation Dashboard

A full-stack web application for creating AI-generated story videos with script generation, voice-over creation, and image generation capabilities.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python + FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Storage**: Local filesystem

## Features

- 📝 **Script Generation**: AI-powered script creation with Claude API and OpenAI integration
- 🎙️ **Voice Over**: Text-to-speech voice generation
- 🖼️ **Image Generation**: Multi-provider image generation (Leonardo.ai, Midjourney, Stable Diffusion)
- ⚙️ **Settings**: API key management and configuration
- 📁 **Project Management**: Organize scripts, audio, and images by project

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose

### Setup

1. **Start the database**:
```bash
docker-compose up -d
```

2. **Backend setup**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

3. **Frontend setup**:
```bash
cd frontend
npm install
npm run dev
```

4. **Configure environment variables**:
   - Copy `.env.example` to `.env` in both `backend/` and `frontend/`
   - Add your API keys for Claude, OpenAI, Leonardo.ai, etc.

## Project Structure

```
.
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   └── services/ # Business logic
│   └── alembic/      # Database migrations
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
└── storage/          # File storage
    ├── scripts/
    ├── voiceovers/
    └── images/
```

## API Endpoints

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/scripts` - List scripts
- `POST /api/scripts/generate` - Generate AI script
- `POST /api/images/generate` - Generate images
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

## License

MIT
