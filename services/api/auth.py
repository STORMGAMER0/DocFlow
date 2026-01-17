from typing import Optional
from fastapi import HTTPException
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext

SECRET_KEY = "90df0956d4d0bf51dcbfed9d21e961de41e6ebb0a2192839368fcae669867f4d"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated = "auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password):
    print(f"DEBUG: Hashing string: {password}")
    if len(password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=400, 
            detail="Password is too long. Max length is 72 characters."
        )
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)