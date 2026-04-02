import cv2
import numpy as np
from services.ocr_library import functions
import os

MAPS = ["Bind", "Haven", "Split", "Ascent", "Icebox", "Breeze", "Fracture", "Lotus", "Sunset", "Pearl", "Abyss"]

def process_scoreboard_image(image_bytes: bytes):
    """
    Takes image bytes, returns a dictionary containing map_name, and player stats.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image_colored = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    image = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    map_name = functions.find_map_name(image, MAPS)
    
    try:
        table_image, table_image_colored = functions.find_tables(image, image_colored)
        cell_images_rows, headshots_images_rows = functions.extract_cell_images_from_table(table_image, table_image_colored)
        agents = functions.identify_agents(headshots_images_rows)
        output = functions.read_table_rows(cell_images_rows)
        
        players = []
        for i, row in enumerate(output):
            if len(row) >= 10:
                name = row[0]
                agent = agents[i] if i < len(agents) else "Unknown"
                players.append({
                    "name": name,
                    "agent": agent,
                    "raw_stats": row[1:]
                })
        
        return {
            "success": True,
            "map": map_name,
            "players": players
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
