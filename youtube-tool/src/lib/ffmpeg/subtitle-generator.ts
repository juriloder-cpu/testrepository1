import type { SubtitlePreset, WordTiming } from '@/types';

const DEFAULT_PRESET: Partial<SubtitlePreset> = {
  fontFamily: 'Arial',
  fontSize: 48,
  fontWeight: 'bold',
  primaryColor: 'FFFFFF',
  outlineColor: '000000',
  backgroundColor: '00000000',
  highlightColor: '00FFFF',
  dimColor: 'AAAAAA',
  enableHighlight: false,
  outlineWidth: 3,
  shadowDepth: 2,
  alignment: 2,
  marginLeft: 30,
  marginRight: 30,
  marginVertical: 60,
  fadeIn: 0,
  fadeOut: 0,
};

export class SubtitleGenerator {
  private preset: Partial<SubtitlePreset>;
  private width: number;
  private height: number;

  constructor(preset: Partial<SubtitlePreset> = {}, resolution = { width: 1920, height: 1080 }) {
    this.preset = { ...DEFAULT_PRESET, ...preset };
    this.width = resolution.width;
    this.height = resolution.height;
  }

  generateASS(words: WordTiming[]): string {
    const header = this.buildHeader();
    const styles = this.buildStyles();
    const events = this.preset.enableHighlight
      ? this.buildKaraokeEvents(words)
      : this.buildSimpleEvents(words);

    return `${header}\n${styles}\n${events}`;
  }

  private buildHeader(): string {
    return `[Script Info]
ScriptType: v4.00+
PlayResX: ${this.width}
PlayResY: ${this.height}
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709`;
  }

  private buildStyles(): string {
    const p = this.preset;
    const bold = p.fontWeight === 'bold' ? 1 : 0;

    // ASS colors are in &HAABBGGRR format
    const primaryColor = `&H00${this.reverseColor(p.primaryColor!)}`;
    const outlineColor = `&H00${this.reverseColor(p.outlineColor!)}`;
    const backColor = `&H${p.backgroundColor!.length === 8 ? p.backgroundColor : '80' + p.backgroundColor}`;

    return `[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${p.fontFamily},${p.fontSize},${primaryColor},${primaryColor},${outlineColor},${backColor},${bold},0,0,0,100,100,0,0,1,${p.outlineWidth},${p.shadowDepth},${p.alignment},${p.marginLeft},${p.marginRight},${p.marginVertical},1
Style: Highlight,${p.fontFamily},${p.fontSize},&H00${this.reverseColor(p.highlightColor!)},${primaryColor},${outlineColor},${backColor},${bold},0,0,0,100,100,0,0,1,${p.outlineWidth},${p.shadowDepth},${p.alignment},${p.marginLeft},${p.marginRight},${p.marginVertical},1
Style: Dim,${p.fontFamily},${p.fontSize},&H00${this.reverseColor(p.dimColor!)},${primaryColor},${outlineColor},${backColor},${bold},0,0,0,100,100,0,0,1,${p.outlineWidth},${p.shadowDepth},${p.alignment},${p.marginLeft},${p.marginRight},${p.marginVertical},1`;
  }

  private buildSimpleEvents(words: WordTiming[]): string {
    const events: string[] = ['[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'];

    // Group words into subtitle chunks (roughly 6-10 words per line)
    const chunks = this.chunkWords(words, 8);

    for (const chunk of chunks) {
      const text = chunk.map(w => w.word).join(' ');
      const start = this.formatTime(chunk[0].start);
      const end = this.formatTime(chunk[chunk.length - 1].end);

      // Add fade effects if configured
      let effectText = text;
      if (this.preset.fadeIn! > 0 || this.preset.fadeOut! > 0) {
        effectText = `{\\fad(${this.preset.fadeIn},${this.preset.fadeOut})}${text}`;
      }

      events.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${effectText}`);
    }

    return events.join('\n');
  }

  private buildKaraokeEvents(words: WordTiming[]): string {
    const events: string[] = ['[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text'];

    // Group words into display chunks
    const chunks = this.chunkWords(words, 7);
    const highlightColor = this.reverseColor(this.preset.highlightColor!);
    const dimColor = this.reverseColor(this.preset.dimColor!);

    for (const chunk of chunks) {
      // For each word in the chunk, create a dialogue line where that word is highlighted
      for (let i = 0; i < chunk.length; i++) {
        const currentWord = chunk[i];

        const text = chunk.map((w, idx) => {
          if (idx === i) {
            return `{\\c&H${highlightColor}&}${w.word}{\\c&H${dimColor}&}`;
          }
          return w.word;
        }).join(' ');

        const start = this.formatTime(currentWord.start);
        const end = this.formatTime(currentWord.end);

        events.push(`Dialogue: 0,${start},${end},Dim,,0,0,0,,${text}`);
      }
    }

    return events.join('\n');
  }

  private chunkWords(words: WordTiming[], maxWords: number): WordTiming[][] {
    const chunks: WordTiming[][] = [];

    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords));
    }

    return chunks;
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
  }

  // Convert RGB to BGR (ASS format)
  private reverseColor(hex: string): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Handle different formats
    if (hex.length === 6) {
      const r = hex.substring(0, 2);
      const g = hex.substring(2, 4);
      const b = hex.substring(4, 6);
      return `${b}${g}${r}`;
    }

    return hex;
  }
}

// Pre-built presets
export const SUBTITLE_PRESETS = {
  classic: {
    fontFamily: 'Arial',
    fontSize: 42,
    fontWeight: 'bold',
    primaryColor: 'FFFFFF',
    outlineColor: '000000',
    outlineWidth: 3,
    shadowDepth: 2,
    enableHighlight: false,
  },

  youtube_modern: {
    fontFamily: 'Montserrat',
    fontSize: 52,
    fontWeight: 'bold',
    primaryColor: 'FFFFFF',
    highlightColor: '00FFFF', // Yellow in BGR
    dimColor: 'AAAAAA',
    outlineColor: '000000',
    outlineWidth: 4,
    shadowDepth: 0,
    enableHighlight: true,
    marginVertical: 80,
  },

  minimal: {
    fontFamily: 'Helvetica Neue',
    fontSize: 38,
    fontWeight: 'normal',
    primaryColor: 'FFFFFF',
    outlineWidth: 0,
    shadowDepth: 0,
    backgroundColor: '80000000',
    marginVertical: 50,
    enableHighlight: false,
  },

  dramatic: {
    fontFamily: 'Impact',
    fontSize: 64,
    fontWeight: 'bold',
    primaryColor: 'FFFFFF',
    highlightColor: '00FFFF',
    dimColor: 'FFFFFF',
    outlineColor: '000000',
    outlineWidth: 5,
    shadowDepth: 3,
    enableHighlight: true,
    marginVertical: 100,
  },

  centered: {
    fontFamily: 'Montserrat',
    fontSize: 48,
    fontWeight: 'bold',
    primaryColor: 'FFFFFF',
    highlightColor: 'FFFFFF',
    dimColor: 'AAAAAA',
    outlineColor: '000000',
    outlineWidth: 3,
    shadowDepth: 2,
    alignment: 5, // Middle center
    marginVertical: 0,
    enableHighlight: true,
  },
};
