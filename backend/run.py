import uvicorn
import os
from config import settings

if __name__ == "__main__":
    port = int(os.getenv("PORT", settings.port))
    host = os.getenv("HOST", settings.host)
    print(f"🗡️ Starting LifeRPG Game Engine on http://{host}:{port}")
    print(f"📖 Swagger Docs available at http://localhost:{port}/docs")
    uvicorn.run("main:app", host=host, port=port, reload=True)
