import { db } from '@/lib/db';
import { ttsResults, segments, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { TTSOptions, WordTiming } from '@/types';

// Adjust this interface based on your TTS API's response format
interface TTSApiResponse {
  audio: ArrayBuffer | string; // Could be base64 or binary
  duration: number;
  // Subtitle data format - adjust based on your API
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
    words?: Array<{
      word: string;
      start: number;
      end: number;
    }>;
  }>;
}

export class TTSService {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async generateTTS(projectId: string, text: string, options: TTSOptions): Promise<string> {
    // Update project status
    await db.update(projects)
      .set({ status: 'generating_tts', updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    // Call your TTS API - ADJUST THIS TO MATCH YOUR API
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: options.voiceId,
        speed: options.speed ?? 1.0,
        // Add other parameters your API needs
        output_format: 'mp3',
        include_timestamps: true, // Request word-level timestamps
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`);
    }

    const data: TTSApiResponse = await response.json();

    // Save audio file
    const projectDir = join(process.cwd(), 'data', 'projects', projectId, 'audio');
    await mkdir(projectDir, { recursive: true });
    const audioPath = join(projectDir, 'voiceover.mp3');

    // Handle audio data (adjust based on your API's response format)
    const audioBuffer = typeof data.audio === 'string'
      ? Buffer.from(data.audio, 'base64')
      : Buffer.from(data.audio);
    await writeFile(audioPath, audioBuffer);

    // Save TTS result with subtitle data
    const [ttsResult] = await db.insert(ttsResults).values({
      projectId,
      audioFilePath: audioPath,
      durationSeconds: data.duration,
      subtitleData: data.words || data.segments, // Store raw timing data
      voiceId: options.voiceId,
      voiceSettings: options,
    }).returning();

    // Update segment timings based on TTS response
    await this.updateSegmentTimings(projectId, data);

    return ttsResult.id;
  }

  private async updateSegmentTimings(projectId: string, ttsData: TTSApiResponse): Promise<void> {
    // Get all segments for this project
    const projectSegments = await db.query.segments.findMany({
      where: eq(segments.projectId, projectId),
      orderBy: (segments, { asc }) => [asc(segments.segmentOrder)],
    });

    if (!ttsData.words && !ttsData.segments) return;

    // If API returns segment-level timing directly
    if (ttsData.segments) {
      for (let i = 0; i < Math.min(projectSegments.length, ttsData.segments.length); i++) {
        const seg = projectSegments[i];
        const timing = ttsData.segments[i];

        await db.update(segments)
          .set({
            startTime: timing.start,
            endTime: timing.end,
            duration: timing.end - timing.start,
          })
          .where(eq(segments.id, seg.id));
      }
    }
    // If API only returns word-level timing, calculate segment timing
    else if (ttsData.words) {
      // Match words to segments by accumulating text
      let wordIndex = 0;

      for (const seg of projectSegments) {
        const segmentWords = seg.text.split(/\s+/).filter(w => w.length > 0);
        const startWordIndex = wordIndex;
        wordIndex += segmentWords.length;

        if (startWordIndex < ttsData.words.length) {
          const startTime = ttsData.words[startWordIndex].start;
          const endWordIndex = Math.min(wordIndex - 1, ttsData.words.length - 1);
          const endTime = ttsData.words[endWordIndex].end;

          await db.update(segments)
            .set({
              startTime,
              endTime,
              duration: endTime - startTime,
            })
            .where(eq(segments.id, seg.id));
        }
      }
    }
  }

  // Get word-level timing for subtitle generation
  async getWordTimings(projectId: string): Promise<WordTiming[]> {
    const ttsResult = await db.query.ttsResults.findFirst({
      where: eq(ttsResults.projectId, projectId),
    });

    if (!ttsResult?.subtitleData) return [];

    const data = ttsResult.subtitleData as TTSApiResponse['words'] | TTSApiResponse['segments'];

    // Normalize to word array
    if (Array.isArray(data) && data.length > 0) {
      if ('word' in data[0]) {
        return data as WordTiming[];
      }
      // If segments, flatten words
      return (data as TTSApiResponse['segments'])!
        .flatMap(s => s.words || []);
    }

    return [];
  }
}
