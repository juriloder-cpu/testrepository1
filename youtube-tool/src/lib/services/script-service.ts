import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { scripts, segments, projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ScriptSegment, GenerateScriptOptions } from '@/types';

export class ScriptService {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async generateScript(options: GenerateScriptOptions): Promise<{ scriptId: string; segments: ScriptSegment[] }> {
    const { projectId, prompt, targetDuration = 60, style = 'educational' } = options;

    // Update project status
    await db.update(projects)
      .set({ status: 'scripting', updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    const systemPrompt = this.buildSystemPrompt(targetDuration, style);

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const parsedSegments = this.parseScriptIntoSegments(content.text);
    const fullText = parsedSegments.map(s => s.text).join('\n\n');

    // Save script
    const [script] = await db.insert(scripts).values({
      projectId,
      fullText,
      generationPrompt: prompt,
      wordCount: this.countWords(fullText),
      estimatedDuration: this.estimateDuration(fullText),
    }).returning();

    // Save segments
    for (let i = 0; i < parsedSegments.length; i++) {
      const seg = parsedSegments[i];
      await db.insert(segments).values({
        projectId,
        scriptId: script.id,
        segmentOrder: i,
        text: seg.text,
        segmentType: seg.type,
      });
    }

    return { scriptId: script.id, segments: parsedSegments };
  }

  private buildSystemPrompt(targetDuration: number, style: string): string {
    const wordsPerMinute = 150; // Average speaking rate
    const targetWords = targetDuration * wordsPerMinute;

    return `You are a professional YouTube scriptwriter. Write engaging, long-form scripts optimized for voice-over narration.

TARGET: ${targetDuration} minutes (approximately ${targetWords} words)
STYLE: ${style}

STRUCTURE YOUR SCRIPT WITH CLEAR MARKERS:
- Use [INTRO] for the introduction
- Use [SECTION: Title] for main sections
- Use [TRANSITION] for transitions between topics
- Use [OUTRO] for the conclusion

GUIDELINES:
1. Write in a conversational, engaging tone suitable for voice-over
2. Include natural pauses (indicated by "..." or paragraph breaks)
3. Avoid overly complex sentences - they're hard to voice naturally
4. Each section should be roughly 2-5 minutes (300-750 words)
5. Include hooks and engaging questions to maintain viewer interest
6. Write for AUDIO - avoid references to "as you can see" unless there will be visuals
7. DO NOT include timestamps or time markers
8. DO NOT include stage directions like (pause) or [show image]

IMPORTANT: Write the COMPLETE script. Do not summarize or abbreviate. The full script should be approximately ${targetWords} words.`;
  }

  private parseScriptIntoSegments(text: string): ScriptSegment[] {
    const segments: ScriptSegment[] = [];

    // Split by markers
    const markerRegex = /\[(INTRO|SECTION:\s*[^\]]+|TRANSITION|OUTRO)\]/gi;
    const parts = text.split(markerRegex);

    let currentType: ScriptSegment['type'] = 'section';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();

      if (!part) continue;

      // Check if this part is a marker
      if (part.toUpperCase() === 'INTRO') {
        currentType = 'intro';
      } else if (part.toUpperCase().startsWith('SECTION:')) {
        currentType = 'section';
      } else if (part.toUpperCase() === 'TRANSITION') {
        currentType = 'transition';
      } else if (part.toUpperCase() === 'OUTRO') {
        currentType = 'outro';
      } else {
        // This is actual content
        segments.push({
          type: currentType,
          text: part,
          estimatedDuration: this.estimateDuration(part),
        });
      }
    }

    // If no markers found, split by paragraphs
    if (segments.length === 0) {
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
      return paragraphs.map((p, i) => ({
        type: i === 0 ? 'intro' : i === paragraphs.length - 1 ? 'outro' : 'section',
        text: p.trim(),
        estimatedDuration: this.estimateDuration(p),
      }));
    }

    return segments;
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  private estimateDuration(text: string): number {
    const words = this.countWords(text);
    const wordsPerMinute = 150;
    return Math.ceil((words / wordsPerMinute) * 60); // Return seconds
  }

  // Method to manually update/edit script
  async updateScript(scriptId: string, fullText: string): Promise<void> {
    await db.update(scripts)
      .set({
        fullText,
        wordCount: this.countWords(fullText),
        estimatedDuration: this.estimateDuration(fullText),
        updatedAt: new Date()
      })
      .where(eq(scripts.id, scriptId));
  }

  // Re-segment an existing script
  async resegmentScript(scriptId: string): Promise<void> {
    const script = await db.query.scripts.findFirst({
      where: eq(scripts.id, scriptId),
    });

    if (!script) throw new Error('Script not found');

    // Delete existing segments
    await db.delete(segments).where(eq(segments.scriptId, scriptId));

    // Re-parse and create new segments
    const parsedSegments = this.parseScriptIntoSegments(script.fullText);

    for (let i = 0; i < parsedSegments.length; i++) {
      const seg = parsedSegments[i];
      await db.insert(segments).values({
        projectId: script.projectId,
        scriptId: script.id,
        segmentOrder: i,
        text: seg.text,
        segmentType: seg.type,
      });
    }
  }
}
