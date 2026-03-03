from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.database import get_db
from app.schemas.user_schema import UserCreate, UserLogin, UserResponse, Token
from app.services import auth_service

router = APIRouter(tags=["Authentication"])
security = HTTPBearer()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    return auth_service.register_user(user_data, db)


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    access_token = auth_service.login_user(
        email=user_credentials.email,
        password=user_credentials.password,
        db=db
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current authenticated user information."""
    user = auth_service.get_user_from_token(credentials.credentials, db)
    return user
