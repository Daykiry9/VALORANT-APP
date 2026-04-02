import httpx
import os
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# Configuración básica para OAuth con RSO
# Nota: CLIENT_ID y CLIENT_SECRET deben venir del Riot Developer Portal.
RSO_CLIENT_ID = os.getenv("RSO_CLIENT_ID")
RSO_CLIENT_SECRET = os.getenv("RSO_CLIENT_SECRET")
RSO_REDIRECT_URI = os.getenv("RSO_REDIRECT_URI")
RSO_TOKEN_URL = "https://auth.riotgames.com/token"
RSO_USERINFO_URL = "https://auth.riotgames.com/userinfo"

class RiotAuthService:
    @staticmethod
    async def exchange_code(code: str) -> Optional[Dict[str, Any]]:
        """Intercambia el código de OAuth por access_token y refresh_token"""
        if not RSO_CLIENT_ID or not RSO_CLIENT_SECRET:
            logger.error("RSO Client Credentials not configured in .env")
            return None
            
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": RSO_REDIRECT_URI,
            "client_id": RSO_CLIENT_ID,
            "client_secret": RSO_CLIENT_SECRET
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(RSO_TOKEN_URL, data=data)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Error exchanging RSO code: {e.response.text}")
                return None

    @staticmethod
    async def get_user_puuid(access_token: str) -> Optional[str]:
        """Obtiene el PUUID del usuario vinculado usando su access_token"""
        headers = {"Authorization": f"Bearer {access_token}"}
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(RSO_USERINFO_URL, headers=headers)
                response.raise_for_status()
                data = response.json()
                return data.get("sub") # El sub suele ser el PUUID en OpenID
            except httpx.HTTPStatusError as e:
                logger.error(f"Error fetching RSO userinfo: {e.response.text}")
                return None

    @staticmethod
    async def refresh_token(refresh_token: str) -> Optional[Dict[str, Any]]:
        """Refresca el access_token usando el refresh_token"""
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": RSO_CLIENT_ID,
            "client_secret": RSO_CLIENT_SECRET
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(RSO_TOKEN_URL, data=data)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Error refreshing RSO token: {e.response.text}")
                return None
