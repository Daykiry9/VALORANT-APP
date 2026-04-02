import os
import httpx
import asyncio
from aiolimiter import AsyncLimiter
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

load_dotenv = lambda: None # placeholder
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

logger = logging.getLogger(__name__)

class RiotAPIClient:
    def __init__(self, api_key: str = None, region: str = "na"):
        self.api_key = api_key or os.getenv("RIOT_API_KEY")
        self.region = region # e.g., na, eu, ap, la1, la2, kr, br
        self.routing_region = self._get_routing_region(region)
        self.base_url = f"https://{self.routing_region}.api.riotgames.com"
        
        # Rate Limits (Dev Key)
        # 20 req / 1 second
        # 100 req / 2 minutes
        self.limiter_1s = AsyncLimiter(20, 1)
        self.limiter_2m = AsyncLimiter(100, 120)
        
        self.client = httpx.AsyncClient(timeout=30.0)

    def _get_routing_region(self, region: str) -> str:
        """Determina la region de ruteo para val-match-v1"""
        mapping = {
            "na": "na", "br": "br", "la1": "latam", "la2": "latam",
            "eu": "esports-magnum", # esports-magnum or use standard regions
            "ap": "ap", "kr": "kr"
        }
        # For val-match-v1 specifically, the routing regions are often different than the location.
        # But for dev apps, typically [region].api.riotgames.com
        return region

    async def request(self, endpoint: str, method: str = "GET", params: Dict[str, Any] = None, data: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}{endpoint}"
        headers = {"X-Riot-Token": self.api_key}
        
        async with self.limiter_1s:
            async with self.limiter_2m:
                try:
                    response = await self.client.request(method, url, params=params, json=data, headers=headers)
                    
                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", 10))
                        logger.warning(f"Rate limited by Riot API. Retrying in {retry_after}s...")
                        await asyncio.sleep(retry_after)
                        return await self.request(endpoint, method, params, data)
                    
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error {e.response.status_code} for {url}: {e.response.text}")
                    return None
                except Exception as e:
                    logger.error(f"Error during Riot API request: {e}")
                    return None

    async def get_match(self, match_id: str) -> Optional[Dict[str, Any]]:
        return await self.request(f"/val/match/v1/matches/{match_id}")

    async def get_matchlist(self, puuid: str) -> Optional[Dict[str, Any]]:
        return await self.request(f"/val/match/v1/matchlists/by-puuid/{puuid}")

    async def close(self):
        await self.client.aclose()
