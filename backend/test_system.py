import httpx
import asyncio
import os
import sys
from dotenv import load_dotenv

# Asegurar que el directorio actual esté en el path
sys.path.append(os.getcwd())

load_dotenv()

async def test_api():
    print("🚀 Iniciando Test de Integración VAL Analytics...")
    
    # 1. Test Root
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get("http://localhost:8000/")
            print(f"✅ API Status: {r.json().get('message', 'Running')}")
        except Exception as e:
            print(f"❌ Error conectando a localhost:8000: {e}")
            
        try:
            # 2. Test Gemini AI (verificando variables)
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                print(f"✅ Gemini API Key detectada: {api_key[:10]}...")
            else:
                print("⚠️ Gemini API Key no encontrada en .env")
            
            # 3. Test de Base de Datos
            print("🗄️ Verificando conexión a Supabase...")
            from database import engine
            with engine.connect() as conn:
                print("✅ Conexión a Supabase exitosa.")
            
        except Exception as e:
            print(f"❌ Error en la lógica del test: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api())
