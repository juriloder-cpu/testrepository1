interface OverlayConfig {
  inputIndex: number;
  x: string;
  y: string;
  scale?: number;
  enableTimes?: Array<{ start: number; end: number }>;
}

interface KenBurnsConfig {
  type: 'in' | 'out' | 'pan_left' | 'pan_right';
  intensity?: number; // 1.0 - 1.1 typical
}

export class FFmpegFilterBuilder {
  private width: number;
  private height: number;
  private fps: number;
  private filters: string[] = [];
  private currentStream: string = '[0:v]';
  private streamCounter: number = 0;

  constructor(config: { width?: number; height?: number; fps?: number } = {}) {
    this.width = config.width || 1920;
    this.height = config.height || 1080;
    this.fps = config.fps || 30;
  }

  // Scale and pad input to target resolution
  scaleToFit(): this {
    const next = this.nextStream();
    this.filters.push(
      `${this.currentStream}scale=${this.width}:${this.height}:force_original_aspect_ratio=decrease,` +
      `pad=${this.width}:${this.height}:(ow-iw)/2:(oh-ih)/2:black,setsar=1${next}`
    );
    this.currentStream = next;
    return this;
  }

  // Add Ken Burns effect (subtle zoom/pan)
  addKenBurns(config: KenBurnsConfig = { type: 'in' }): this {
    const next = this.nextStream();
    const intensity = config.intensity || 1.04;

    let zoomExpr: string;
    let xExpr: string;
    let yExpr: string;

    switch (config.type) {
      case 'in':
        zoomExpr = `'min(${intensity},1+on/${this.fps}/10)'`;
        xExpr = "'iw/2-(iw/zoom/2)'";
        yExpr = "'ih/2-(ih/zoom/2)'";
        break;
      case 'out':
        zoomExpr = `'${intensity}-on/${this.fps}/10'`;
        xExpr = "'iw/2-(iw/zoom/2)'";
        yExpr = "'ih/2-(ih/zoom/2)'";
        break;
      case 'pan_left':
        zoomExpr = `'${intensity}'`;
        xExpr = `'(iw-iw/zoom)*(1-on/d)'`;
        yExpr = "'ih/2-(ih/zoom/2)'";
        break;
      case 'pan_right':
        zoomExpr = `'${intensity}'`;
        xExpr = `'(iw-iw/zoom)*on/d'`;
        yExpr = "'ih/2-(ih/zoom/2)'";
        break;
    }

    this.filters.push(
      `${this.currentStream}zoompan=z=${zoomExpr}:x=${xExpr}:y=${yExpr}:` +
      `d=1:s=${this.width}x${this.height}:fps=${this.fps}${next}`
    );
    this.currentStream = next;
    return this;
  }

  // Add an overlay (logo, watermark, etc.)
  addOverlay(config: OverlayConfig): this {
    const overlayInput = `[${config.inputIndex}:v]`;
    const scaledOverlay = this.nextStream();
    const afterOverlay = this.nextStream();

    // Scale overlay if needed
    if (config.scale && config.scale !== 100) {
      const scaleValue = config.scale / 100;
      this.filters.push(
        `${overlayInput}scale=iw*${scaleValue}:ih*${scaleValue}${scaledOverlay}`
      );
    } else {
      this.filters.push(`${overlayInput}copy${scaledOverlay}`);
    }

    // Build enable expression for timed overlays
    let enableExpr = '';
    if (config.enableTimes && config.enableTimes.length > 0) {
      const conditions = config.enableTimes
        .map(t => `between(t,${t.start},${t.end})`)
        .join('+');
      enableExpr = `:enable='${conditions}'`;
    }

    this.filters.push(
      `${this.currentStream}${scaledOverlay}overlay=${config.x}:${config.y}${enableExpr}${afterOverlay}`
    );
    this.currentStream = afterOverlay;
    return this;
  }

  // Add ASS subtitles
  addSubtitles(assPath: string): this {
    const next = this.nextStream();
    // Escape path for FFmpeg
    const escapedPath = assPath.replace(/'/g, "'\\''").replace(/:/g, '\\:');
    this.filters.push(`${this.currentStream}ass='${escapedPath}'${next}`);
    this.currentStream = next;
    return this;
  }

  // Add fade in/out
  addFade(fadeIn: number = 0, fadeOut: number = 0, totalDuration: number): this {
    if (fadeIn === 0 && fadeOut === 0) return this;

    const next = this.nextStream();
    const fadeFilters: string[] = [];

    if (fadeIn > 0) {
      fadeFilters.push(`fade=t=in:st=0:d=${fadeIn / 1000}`);
    }
    if (fadeOut > 0) {
      fadeFilters.push(`fade=t=out:st=${totalDuration - fadeOut / 1000}:d=${fadeOut / 1000}`);
    }

    this.filters.push(`${this.currentStream}${fadeFilters.join(',')}${next}`);
    this.currentStream = next;
    return this;
  }

  // Add color correction / grading
  addColorGrade(config: { brightness?: number; contrast?: number; saturation?: number } = {}): this {
    const next = this.nextStream();
    const { brightness = 0, contrast = 1, saturation = 1 } = config;

    this.filters.push(
      `${this.currentStream}eq=brightness=${brightness}:contrast=${contrast}:saturation=${saturation}${next}`
    );
    this.currentStream = next;
    return this;
  }

  // Raw filter for custom operations
  addRawFilter(filter: string): this {
    const next = this.nextStream();
    this.filters.push(`${this.currentStream}${filter}${next}`);
    this.currentStream = next;
    return this;
  }

  private nextStream(): string {
    this.streamCounter++;
    return `[v${this.streamCounter}]`;
  }

  // Build the filter complex string
  build(): { filterComplex: string; outputStream: string } {
    if (this.filters.length === 0) {
      return { filterComplex: '', outputStream: '[0:v]' };
    }

    // Replace last stream marker with [vout]
    const lastFilter = this.filters[this.filters.length - 1];
    this.filters[this.filters.length - 1] = lastFilter.replace(/\[v\d+\]$/, '[vout]');

    return {
      filterComplex: this.filters.join(';\n'),
      outputStream: '[vout]'
    };
  }

  // Reset for reuse
  reset(): void {
    this.filters = [];
    this.currentStream = '[0:v]';
    this.streamCounter = 0;
  }
}
