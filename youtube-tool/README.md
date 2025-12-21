# YouTube Video Production Tool

A comprehensive, modular YouTube video production tool that automates the entire workflow from script generation to final video export. Designed for **long-form content (1-3 hours)** with cost-effectiveness, performance, and extensibility in mind.

## Features

### Core Capabilities
- **Script Generation** - AI-powered long-form script creation with structured segments using Claude API
- **Text-to-Speech** - Integration with TTS API that returns audio + word-level timestamps
- **Image Generation** - Per-segment image generation with character consistency support
- **Video Assembly** - Local FFmpeg-based rendering with custom subtitles and overlays
- **Project Management** - Database-driven project system linking all assets

### Design Principles
- **Modularity**: Each component is independently testable and replaceable
- **Extensibility**: Easy to add new TTS providers, image generators, or export formats
- **Cost Efficiency**: Optimized for minimal API calls, local processing where possible
- **Long-Form Focus**: Architecture handles 1-3 hour videos without timeouts or memory issues

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS
- **State Management**: Zustand for global state, React Query for server state
- **Script Generation**: Claude API (Anthropic)
- **Video Processing**: FFmpeg (local installation)
- **TypeScript**: Full type safety throughout

## Project Structure

```
youtube-tool/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   └── projects/       # Projects pages
│   │   ├── api/                # API routes
│   │   │   └── projects/       # Project CRUD endpoints
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── projects/           # Project-specific components
│   │   ├── script/             # Script editor components
│   │   ├── images/             # Image selection components
│   │   └── render/             # Render settings components
│   ├── lib/
│   │   ├── db/                 # Database setup
│   │   │   ├── schema.ts       # Drizzle schema
│   │   │   ├── index.ts        # DB connection
│   │   │   └── migrations/     # SQL migrations
│   │   ├── services/           # Business logic
│   │   │   ├── script-service.ts
│   │   │   ├── tts-service.ts
│   │   │   └── render-service.ts (coming)
│   │   ├── ffmpeg/             # FFmpeg utilities
│   │   │   ├── filter-builder.ts
│   │   │   └── subtitle-generator.ts
│   │   └── utils/              # Helper functions
│   └── types/                  # TypeScript types
├── data/                       # Local data storage
│   ├── projects/               # Project assets
│   └── database.sqlite         # SQLite database
└── public/
    └── fonts/                  # Custom fonts for subtitles
```

## Getting Started

### Prerequisites

- Node.js 18+
- FFmpeg (for video rendering)
- Claude API key (for script generation)
- TTS API credentials (for voice generation)

### Installation

1. **Install dependencies**:
```bash
cd youtube-tool
npm install
```

2. **Set up environment variables**:
Create a `.env.local` file:
```env
CLAUDE_API_KEY=your_claude_api_key
TTS_API_KEY=your_tts_api_key
TTS_API_URL=your_tts_api_url
```

3. **Initialize database**:
```bash
npm run db:generate
npm run db:migrate
```

4. **Install FFmpeg** (if not already installed):

**macOS**:
```bash
brew install ffmpeg
```

**Ubuntu/Debian**:
```bash
sudo apt install ffmpeg
```

**Windows**: Download from [ffmpeg.org](https://ffmpeg.org)

5. **Run development server**:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Project

1. Navigate to the Projects page
2. Click "Create Project"
3. Enter project title and description
4. Set target duration (in minutes)

### Script Generation

1. Open a project
2. Navigate to the Script tab
3. Enter your script prompt
4. Choose style (educational, entertainment, documentary, storytelling)
5. Click "Generate Script"
6. Review and edit generated segments

### TTS Generation

1. After finalizing script, navigate to Voice-Over tab
2. Select voice settings
3. Click "Generate Voice-Over"
4. System automatically syncs timing with segments

### Image Generation

1. Navigate to Images tab
2. For each segment, generate images using prompts
3. Select character profiles for consistency
4. Choose preferred image for each segment
5. Configure image effects (Ken Burns, pan, etc.)

### Rendering

1. Navigate to Render tab
2. Configure subtitle settings
3. Add overlays (logos, watermarks)
4. Set quality settings
5. Click "Start Render"
6. Monitor progress in real-time

## Database Schema

### Core Tables

- **projects** - Main project metadata
- **scripts** - Generated scripts with full text
- **segments** - Script segments with timing and selected images
- **tts_results** - Audio files and subtitle data
- **images** - Generated images for segments
- **characters** - Character profiles for consistency
- **subtitle_presets** - Subtitle styling configurations
- **overlays** - Logo/watermark overlays
- **renders** - Render jobs and progress
- **app_settings** - Global application settings

## API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Scripts (Coming Soon)
- `POST /api/projects/[id]/script` - Generate script
- `PATCH /api/projects/[id]/script` - Update script

### TTS (Coming Soon)
- `POST /api/projects/[id]/tts` - Generate voice-over

### Images (Coming Soon)
- `POST /api/projects/[id]/images` - Generate images

### Render (Coming Soon)
- `POST /api/projects/[id]/render` - Start render
- `GET /api/projects/[id]/render/[renderId]` - Get render status

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Next.js project setup
- [x] Database schema with Drizzle
- [x] Project CRUD operations
- [x] Basic UI dashboard

### Phase 2: Script Module (In Progress)
- [x] Script service implementation
- [ ] Script editor UI
- [ ] Segment visualization
- [ ] AI-powered generation

### Phase 3: TTS Module (Coming Soon)
- [x] TTS service implementation
- [ ] API integration
- [ ] Timing synchronization
- [ ] Audio preview

### Phase 4: Image Module (Coming Soon)
- [ ] Image generation service
- [ ] Character profile system
- [ ] Image selection UI
- [ ] Batch generation

### Phase 5: Render Module (Coming Soon)
- [x] FFmpeg filter builder
- [x] Subtitle generator
- [ ] Render service
- [ ] Progress tracking UI
- [ ] Queue management

### Phase 6: Polish (Coming Soon)
- [ ] Timeline preview
- [ ] Overlay system UI
- [ ] Settings management
- [ ] Error handling
- [ ] Performance optimization

## Configuration

### GPU Encoding

For faster renders on long videos, configure GPU encoding:

**NVIDIA**:
```typescript
useGpuEncoding: true,
gpuEncoder: 'h264_nvenc'
```

**AMD**:
```typescript
useGpuEncoding: true,
gpuEncoder: 'h264_amf'
```

**macOS**:
```typescript
useGpuEncoding: true,
gpuEncoder: 'h264_videotoolbox'
```

### Custom Fonts

Place TTF/OTF fonts in `public/fonts/` and reference them in subtitle presets.

## Performance Notes

- **Memory**: For 2-3 hour videos, ensure 10-20GB disk space for temp files
- **API Rate Limits**: Image generation includes built-in queuing to avoid throttling
- **Database**: SQLite with WAL mode for better concurrent access
- **Rendering**: Background queue system prevents UI blocking

## Troubleshooting

### Database Issues
```bash
# Reset database
rm data/database.sqlite
npm run db:generate
npm run db:migrate
```

### FFmpeg Not Found
Ensure FFmpeg is in your PATH or set custom path in settings.

### API Errors
Check API keys in settings and ensure sufficient credits.

## Contributing

This is a comprehensive tool with many extension points:

- **New TTS providers**: Implement the `TTSService` interface
- **New image generators**: Add to `image-service.ts`
- **Custom subtitle styles**: Add presets to `subtitle-generator.ts`
- **New export formats**: Extend `render-service.ts`

## License

MIT

## Support

For issues and questions, please check:
- Database schema: `src/lib/db/schema.ts`
- Service implementations: `src/lib/services/`
- API routes: `src/app/api/`
