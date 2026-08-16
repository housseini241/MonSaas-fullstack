"""
hustart SaaS - Modèles Pydantic
Extraits depuis backend/server.py — sections "Models" et "Marketplace Models".
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------- Models ----------
class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    full_name: str
    created_at: str
    is_admin: bool = False


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    converted_from_demande_id: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)


class SessionOut(BaseModel):
    id: str
    created_at: str
    last_used_at: str
    user_agent: Optional[str] = None
    current: bool = False


class GenerateSiteIn(BaseModel):
    business_name: str
    business_type: str
    services: List[str]
    city: str
    phone: str
    email: Optional[str] = None
    description: Optional[str] = None
    style: str = "moderne"
    generate_image: bool = True


class PreviewSiteIn(GenerateSiteIn):
    """Identique à GenerateSiteIn — payload complet de l'onboarding, utilisé pour générer une preview non persistée."""
    pass


class CheckoutPreviewIn(BaseModel):
    draft_id: str
    package_id: str   # "pro_monthly" ou "pro_yearly"
    origin_url: str


class SiteContent(BaseModel):
    tagline: str
    hero_title: str
    hero_subtitle: str
    hero_cta: str
    value_props: List[Dict[str, str]]
    services: List[Dict[str, str]]
    about_title: str
    about_text: str
    why_us: List[str]
    contact_intro: str
    seo_title: str
    seo_description: str
    seo_keywords: List[str]


class Site(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    slug: str
    business_name: str
    business_type: str
    services: List[str]
    city: str
    phone: str
    email: Optional[str] = None
    style: str
    content: Dict[str, Any]
    hero_image_url: Optional[str] = None
    logo_url: Optional[str] = None
    service_image_urls: Optional[List[str]] = None
    status: str = "draft"
    created_at: str
    updated_at: str
    credentials: Optional[List[str]] = None
    realisations: Optional[List[Dict[str, Any]]] = None
    transformations: Optional[List[Dict[str, Any]]] = None


class SiteUpdate(BaseModel):
    business_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    services: Optional[List[str]] = None
    content: Optional[Dict[str, Any]] = None
    hero_image_url: Optional[str] = None
    logo_url: Optional[str] = None
    service_image_urls: Optional[List[str]] = None
    style: Optional[str] = None
    slug: Optional[str] = Field(default=None, min_length=3, max_length=60)
    show_map: Optional[bool] = None
    map_address: Optional[str] = None
    theme: Optional[Dict[str, Any]] = None
    section_order: Optional[List[str]] = None
    credentials: Optional[List[str]] = None
    realisations: Optional[List[Dict[str, Any]]] = None
    transformations: Optional[List[Dict[str, Any]]] = None


class DomainConnectIn(BaseModel):
    domain: str = Field(min_length=4, max_length=253)


class SlugCheckIn(BaseModel):
    slug: str = Field(min_length=3, max_length=60)


class LeadIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    message: str


class Lead(BaseModel):
    id: str
    site_id: str
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    created_at: str


class CheckoutIn(BaseModel):
    package_id: str
    origin_url: str


class ReviewIn(BaseModel):
    author: str = Field(min_length=2, max_length=80)
    profession: str = Field(min_length=2, max_length=60)
    city: str = Field(min_length=2, max_length=60)
    email: EmailStr
    rating: int = Field(ge=1, le=5)
    quote: str = Field(min_length=20, max_length=600)
    avatar_url: Optional[str] = None


# ---------- Marketplace Models ----------
class DemandeIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    city: str = Field(min_length=2, max_length=100)
    besoin: str = Field(min_length=10, max_length=2000)
    urgence: str = Field(default="normal", pattern=r"^(normal|urgent|tres_urgent)$")
    artisan_slug: Optional[str] = Field(default=None, max_length=60)
    type_logement: Optional[str] = Field(default=None, max_length=60)
    code_postal: Optional[str] = Field(default=None, max_length=10)


class AdminDemandeIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    city: str = Field(min_length=2, max_length=100)
    code_postal: Optional[str] = Field(default=None, max_length=10)
    besoin: str = Field(min_length=10, max_length=2000)
    urgence: str = Field(default="normal", pattern=r"^(normal|urgent|tres_urgent)$")
    type_travaux: Optional[str] = Field(default=None, max_length=60)
    type_logement: Optional[str] = Field(default=None, max_length=60)
    origin_note: Optional[str] = Field(default=None, max_length=300)


class AdminDemandeUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern=r"^(nouvelle|en_cours|pourvue|archivee)$")
    public_teaser: Optional[str] = Field(default=None, max_length=300)


class AdminCampaignIn(BaseModel):
    demande_id: str
    trade: Optional[str] = None
    city: Optional[str] = None
    artisan_emails: Optional[List[EmailStr]] = None  # override manuel de la cible


class VisibilityUpdate(BaseModel):
    marketplace_visible: Optional[bool] = None
    disponibilite: Optional[str] = Field(default=None, pattern=r"^(disponible|occupe|conges)$")
    zone_km: Optional[int] = Field(default=None, ge=1, le=200)
    gallery: Optional[List[str]] = Field(default=None, max_length=10)


# ---------- E-Commerce Models ----------
class ShopCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    city: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None


class ShopUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=100)
    description: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    tax_rate: Optional[float] = Field(default=None, ge=0, le=1)
    currency: Optional[str] = None
    shipping_rates: Optional[List[Dict[str, Any]]] = None
    theme: Optional[Dict[str, Any]] = None
    logo_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    slug: Optional[str] = Field(default=None, min_length=3, max_length=60)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: Optional[str] = None
    price_cents: int = Field(ge=0)
    compare_at_cents: Optional[int] = Field(default=None, ge=0)
    stock: int = Field(ge=0, default=0)
    category: Optional[str] = None
    images: Optional[List[str]] = None
    variants: Optional[List[Dict[str, Any]]] = None
    active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_cents: Optional[int] = Field(default=None, ge=0)
    compare_at_cents: Optional[int] = Field(default=None, ge=0)
    stock: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = None
    images: Optional[List[str]] = None
    variants: Optional[List[Dict[str, Any]]] = None
    active: Optional[bool] = None


class CartItemIn(BaseModel):
    product_id: str
    qty: int = Field(ge=1, le=50)
    variant: Optional[Dict[str, str]] = None


class CheckoutShopIn(BaseModel):
    items: List[CartItemIn]
    customer_name: str = Field(min_length=2, max_length=120)
    customer_email: EmailStr
    customer_phone: Optional[str] = None
    shipping_method_id: str
    shipping_address: Optional[str] = None
    origin_url: str


class OrderStatusUpdate(BaseModel):
    status: str


# ---------- Domain Marketplace Models ----------
class DomainPurchaseIn(BaseModel):
    domain: str = Field(min_length=4, max_length=253)
    project_id: Optional[str] = None
    project_kind: str = Field(default="site")
    origin_url: str
