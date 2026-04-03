import os
import json
import io
import google.generativeai as genai
from PIL import Image

# Initialize Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def process_scoreboard_image(image_bytes: bytes):
    """
    Uses Gemini Vision AI to extract Valorant match data from ANY screenshot format.
    Supports: Scoreboards (stats), Timeline (rounds), and Summary screens.
    """
    try:
        # Load image for Gemini
        img = Image.open(io.BytesIO(image_bytes))
        
        # Initialize model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = """
        Analyze this Valorant match screenshot and extract all available data into a valid JSON object.
        Look for:
        1. General Info: Map name, final score (winner score and loser score).
        2. Scoreboard: For each player, extract Name, Agent, ACS, K, D, A, Econ, FB, Plants, Defuses.
        3. Timeline: For each round, extract who won (Our Team or Rival), and how they won (Elimination, Bomb Detonated, Defuse).
        
        If a section is missing from the screenshot, omit it.
        Return ONLY the JSON object. No markdown, no filler text.
        """
        
        response = model.generate_content([prompt, img])
        
        # Clean response text (remove ```json ... ``` if present)
        clean_text = response.text.strip().replace('```json', '').replace('```', '')
        data = json.loads(clean_text)
        
        return {
            "success": True,
            "data": data
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"AI Vision Error: {str(e)}"
        }
