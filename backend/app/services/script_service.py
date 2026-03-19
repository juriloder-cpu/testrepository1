import anthropic
import openai
from sqlalchemy.orm import Session
from app.models.script import Script
from app.schemas.script import ScriptCreate, ScriptGenerateRequest
from app.services.setting_service import get_setting_value


async def generate_script_with_ai(
    db: Session,
    request: ScriptGenerateRequest
) -> str:
    """Generate script using AI provider (Claude or OpenAI)."""

    if request.provider == "claude":
        api_key = get_setting_value(db, "ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("Anthropic API key not configured in settings")

        client = anthropic.Anthropic(api_key=api_key)

        prompt = _build_script_prompt(request)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        return message.content[0].text

    elif request.provider == "openai":
        api_key = get_setting_value(db, "OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not configured in settings")

        client = openai.OpenAI(api_key=api_key)

        prompt = _build_script_prompt(request)

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=4000
        )

        return response.choices[0].message.content

    else:
        raise ValueError(f"Unsupported AI provider: {request.provider}")


def _build_script_prompt(request: ScriptGenerateRequest) -> str:
    """Build the prompt for script generation."""

    if request.custom_prompt:
        return request.custom_prompt

    prompt = f"""Generate a video script with the following specifications:

Genre: {request.genre}
Tone: {request.tone}
Length: {request.length} (short: ~30 seconds, medium: ~1-2 minutes, long: ~3-5 minutes)

Create an engaging story script that includes:
1. A compelling hook/introduction
2. Clear narrative structure
3. Scene descriptions
4. Dialogue or narration text
5. Visual cues for each scene

Format the script with clear scene markers like:

[SCENE 1: Description]
Narration text here...

[SCENE 2: Description]
Narration text here...

Make it suitable for AI-generated voiceover and images."""

    return prompt


async def generate_video_description(db: Session, script_content: str, provider: str = "claude") -> dict:
    """Generate a YouTube video title, description, and tags from a script."""

    prompt = f"""Based on the following video script, generate a YouTube-optimized:
1. **Title** - Catchy, SEO-friendly, under 100 characters
2. **Description** - Engaging YouTube description (200-300 words) with:
   - A compelling hook in the first 2 lines
   - Summary of what the video covers
   - Timestamps placeholder
   - Call to action (like, subscribe, comment)
3. **Tags** - 15-20 relevant YouTube tags as a comma-separated list

Script content:
---
{script_content[:8000]}
---

Respond in this exact JSON format:
{{
  "title": "Your video title here",
  "description": "Full YouTube description here",
  "tags": "tag1, tag2, tag3, ..."
}}"""

    if provider == "claude":
        api_key = get_setting_value(db, "ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("Anthropic API key not configured in settings")

        client = anthropic.Anthropic(api_key=api_key)

        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )

        return _parse_description_response(message.content[0].text)

    elif provider == "openai":
        api_key = get_setting_value(db, "OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not configured in settings")

        client = openai.OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000
        )

        return _parse_description_response(response.choices[0].message.content)

    else:
        raise ValueError(f"Unsupported AI provider: {provider}")


def _parse_description_response(text: str) -> dict:
    """Parse the AI response into structured description data."""
    import json

    # Try to parse as JSON directly
    try:
        # Find JSON block in the response
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(text[start:end])
    except json.JSONDecodeError:
        pass

    # Fallback: return raw text as description
    return {
        "title": "Generated Video",
        "description": text,
        "tags": ""
    }


def export_script(script: Script, format: str = "txt") -> str:
    """Export script content in specified format."""

    if format == "md":
        return f"""# Script: {script.id}

**Created:** {script.created_at}
**AI Provider:** {script.ai_provider or 'Manual'}
**Tone:** {script.tone or 'N/A'}
**Genre:** {script.genre or 'N/A'}

---

{script.content}
"""
    else:  # txt
        return script.content
