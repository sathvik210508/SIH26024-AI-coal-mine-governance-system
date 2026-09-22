import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

user_permissions = Table(
    "user_permissions",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True)
)

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    module = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False) # FIELD_SUPERVISOR, MINE_MANAGER, CORPORATE_EXECUTIVE, GOVERNMENT_REGULATOR
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    
    permissions = relationship("Permission", secondary=role_permissions, backref="roles")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_code = Column(String(50), nullable=False, index=True)
    gov_permission_group = Column(String(50), nullable=True) # REGULATORY_OFFICER, SENIOR_REGULATORY_OFFICER, REGULATORY_ADMIN, ANALYTICS_POLICY_USER
    
    # Scoping / Tenant isolation
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True)
    subsidiary_id = Column(Integer, ForeignKey("subsidiaries.id", ondelete="SET NULL"), nullable=True)
    region_id = Column(Integer, ForeignKey("regions.id", ondelete="SET NULL"), nullable=True)
    mine_id = Column(Integer, ForeignKey("mines.id", ondelete="SET NULL"), nullable=True)
    mine_zone_id = Column(Integer, ForeignKey("mine_zones.id", ondelete="SET NULL"), nullable=True)
    jurisdiction_code = Column(String(100), nullable=True)
    
    phone = Column(String(50), nullable=True)
    badge_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Custom permissions
    permissions = relationship("Permission", secondary=user_permissions, backref="users")
    organization = relationship("Organization", backref="users", foreign_keys=[organization_id])
    mine = relationship("Mine", backref="users", foreign_keys=[mine_id])
