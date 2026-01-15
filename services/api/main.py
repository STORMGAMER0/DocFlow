from fastapi import FastAPI


app = FastAPI(title="DocFlow API")

@app.get("/")
def read_root():
    return {"status": "DocFlow API is Online", "version": "1.0"}

@app.get("/health")
def health_check():
    return {"database": "connected", "storage": "online"}