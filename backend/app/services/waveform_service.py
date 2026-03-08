import os
import shutil
import subprocess
import tempfile
import wave

import numpy as np


def _get_ffmpeg() -> str:
    """Find ffmpeg binary - try system install first, then imageio-ffmpeg."""
    path = shutil.which("ffmpeg")
    if path:
        return path
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    raise FileNotFoundError("FFmpeg not found. Install ffmpeg or pip install imageio-ffmpeg.")


def decode_mp3_to_wav(mp3_path: str, wav_path: str) -> None:
    """Convert MP3 to WAV using ffmpeg."""
    ffmpeg = _get_ffmpeg()
    subprocess.run(
        [ffmpeg, "-y", "-i", mp3_path, "-ac", "1", "-ar", "44100", wav_path],
        check=True,
        capture_output=True,
    )


def read_wav_samples(wav_path: str) -> tuple[np.ndarray, int]:
    """Read WAV file and return normalized samples and sample rate."""
    with wave.open(wav_path, "rb") as wf:
        n_channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        sample_rate = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)

    if sample_width == 2:
        dtype = np.int16
    elif sample_width == 4:
        dtype = np.int32
    else:
        dtype = np.int16

    samples = np.frombuffer(raw, dtype=dtype).astype(np.float64)
    if n_channels > 1:
        samples = samples.reshape(-1, n_channels).mean(axis=1)

    max_val = np.max(np.abs(samples))
    if max_val > 0:
        samples = samples / max_val

    return samples, sample_rate


def generate_waveform_video(mp3_path: str, output_path: str, width: int = 1280, height: int = 720, fps: int = 30) -> str:
    """Generate a waveform video from an MP3 file.

    Creates a white waveform on black background video with the audio.
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        wav_path = os.path.join(tmpdir, "audio.wav")
        decode_mp3_to_wav(mp3_path, wav_path)
        samples, sample_rate = read_wav_samples(wav_path)

        duration = len(samples) / sample_rate
        total_frames = int(duration * fps)

        ffmpeg = _get_ffmpeg()

        # Use ffmpeg pipe to create video efficiently
        ffmpeg_cmd = [
            ffmpeg, "-y",
            # Raw video input from pipe
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-pix_fmt", "rgb24",
            "-s", f"{width}x{height}",
            "-r", str(fps),
            "-i", "pipe:0",
            # Audio input
            "-i", mp3_path,
            # Output settings
            "-c:v", "libx264",
            "-preset", "fast",
            "-crf", "23",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            output_path,
        ]

        proc = subprocess.Popen(
            ffmpeg_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        # Pre-compute waveform parameters
        center_y = height // 2
        bar_width = 3
        bar_gap = 1
        num_bars = width // (bar_width + bar_gap)
        window_samples = int(sample_rate * 2.0)  # 2 second visible window

        for frame_idx in range(total_frames):
            # Create black frame
            frame = np.zeros((height, width, 3), dtype=np.uint8)

            # Current position in samples
            current_sample = int(frame_idx * sample_rate / fps)

            # Window of samples centered around current position
            start = max(0, current_sample - window_samples // 2)
            end = min(len(samples), start + window_samples)
            if end - start < window_samples and start > 0:
                start = max(0, end - window_samples)

            window = samples[start:end]

            if len(window) == 0:
                proc.stdin.write(frame.tobytes())
                continue

            # Downsample window to number of bars
            chunk_size = max(1, len(window) // num_bars)
            bar_heights = []
            for i in range(num_bars):
                chunk_start = i * chunk_size
                chunk_end = min(chunk_start + chunk_size, len(window))
                if chunk_start >= len(window):
                    bar_heights.append(0.0)
                else:
                    chunk = window[chunk_start:chunk_end]
                    rms = np.sqrt(np.mean(chunk ** 2))
                    bar_heights.append(rms)

            max_bar = max(bar_heights) if bar_heights else 1.0
            if max_bar > 0:
                bar_heights = [h / max_bar for h in bar_heights]

            # Draw playhead indicator - highlight the center bar area
            playhead_bar = num_bars // 2

            # Draw bars
            for i, h in enumerate(bar_heights):
                bar_h = int(h * (height * 0.8) / 2)
                if bar_h < 1:
                    bar_h = 1

                x_start = i * (bar_width + bar_gap)
                x_end = x_start + bar_width

                if x_end > width:
                    break

                y_top = center_y - bar_h
                y_bottom = center_y + bar_h

                # Color: white, with playhead bar slightly brighter/blue-tinted
                if i == playhead_bar:
                    frame[y_top:y_bottom, x_start:x_end] = [100, 180, 255]
                else:
                    # Fade bars that are further from center
                    dist = abs(i - playhead_bar) / max(num_bars, 1)
                    brightness = int(255 * max(0.3, 1.0 - dist * 0.7))
                    frame[y_top:y_bottom, x_start:x_end] = [brightness, brightness, brightness]

            proc.stdin.write(frame.tobytes())

        proc.stdin.close()
        stdout, stderr = proc.stdout.read(), proc.stderr.read()
        proc.wait()

        if proc.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {stderr.decode()}")

    return output_path
