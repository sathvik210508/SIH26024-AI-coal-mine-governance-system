from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.auth import User
from app.models.organization import Mine, Organization
from app.auth.jwt import verify_password, create_access_token, get_current_user
from app.services.audit_service import record_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role_code: str
    gov_permission_group: str | None = None
    organization_id: int | None = None
    organization_name: str | None = None
    mine_id: int | None = None
    mine_name: str | None = None
    jurisdiction_code: str | None = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/login", response_model=TokenResponse)
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
        
    token = create_access_token({
        "sub": user.email,
        "role": user.role_code,
        "user_id": user.id,
        "mine_id": user.mine_id,
        "org_id": user.organization_id
    })
    
    # Audit log
    record_audit_event(
        db=db,
        user=user,
        entity_name="USER",
        entity_id=str(user.id),
        action="LOGIN",
        metadata={"email": user.email, "role": user.role_code}
    )
    
    org_name = db.query(Organization.name).filter(Organization.id == user.organization_id).scalar() if user.organization_id else None
    mine_name = db.query(Mine.name).filter(Mine.id == user.mine_id).scalar() if user.mine_id else None
    
    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role_code=user.role_code,
            gov_permission_group=user.gov_permission_group,
            organization_id=user.organization_id,
            organization_name=org_name,
            mine_id=user.mine_id,
            mine_name=mine_name,
            jurisdiction_code=user.jurisdiction_code
        )
    )

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    record_audit_event(
        db=db,
        user=current_user,
        entity_name="USER",
        entity_id=str(current_user.id),
        action="LOGOUT",
        metadata={"email": current_user.email}
    )
    return {"status": "success", "message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    org_name = db.query(Organization.name).filter(Organization.id == current_user.organization_id).scalar() if current_user.organization_id else None
    mine_name = db.query(Mine.name).filter(Mine.id == current_user.mine_id).scalar() if current_user.mine_id else None
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role_code=current_user.role_code,
        gov_permission_group=current_user.gov_permission_group,
        organization_id=current_user.organization_id,
        organization_name=org_name,
        mine_id=current_user.mine_id,
        mine_name=mine_name,
        jurisdiction_code=current_user.jurisdiction_code
    )
