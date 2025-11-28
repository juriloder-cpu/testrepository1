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
            model="claude-3-5-sonnet-20241022",
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
