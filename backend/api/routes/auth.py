from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
from core.riot_api.rso import RiotAuthService
from cryptography.fernet import Fernet
import os

# Clave de encriptación básica para tokens (debería venir de .env)
FERNET_KEY = os.getenv("FERNET_KEY", Fernet.generate_key().decode())
cipher = Fernet(FERNET_KEY.encode())

router = APIRouter()

@router.get("/riot/callback")
async def rso_callback(code: str, player_id: str = Query(...), db: Session = Depends(get_db)):
    """Callback de OAuth para vincular cuenta Riot con un jugador específico"""
    token_data = await RiotAuthService.exchange_code(code)
    if not token_data:
        raise HTTPException(status_code=400, detail="Could not exchange code for tokens")
        
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    
    # Obtener el PUUID del usuario
    puuid = await RiotAuthService.get_user_puuid(access_token)
    if not puuid:
        raise HTTPException(status_code=400, detail="Could not identify Riot account via RSO")
        
    # Buscar el jugador en nuestra base de datos
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not db_player:
        raise HTTPException(status_code=404, detail="Player record not found in platform")
        
    # Encriptar tokens
    db_player.rso_access_token = cipher.encrypt(access_token.encode()).decode()
    db_player.rso_refresh_token = cipher.encrypt(refresh_token.encode()).decode()
    db_player.puuid = puuid
    db_player.rso_linked = True
    
    db.commit()
    db.refresh(db_player)
    
    return {"status": "success", "message": f"Successfully linked Riot ID for {db_player.display_name}", "puuid": puuid}

@router.get("/riot/auth-url")
def get_auth_url(player_id: str):
    """Genera la URL de autorización de Riot para el frontend"""
    # URL: https://auth.riotgames.com/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI&response_type=code&scope=openid+offline_access
    # Deberíamos pasar player_id en el 'state' para recuperarlo en el callback
    client_id = os.getenv("RSO_CLIENT_ID", "DEV-ID")
    redirect_uri = os.getenv("RSO_REDIRECT_URI", "http://localhost:3000/api/auth/riot/callback")
    scope = "openid+offline_access"
    
    url = f"https://auth.riotgames.com/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}&state={player_id}"
    return {"auth_url": url}
