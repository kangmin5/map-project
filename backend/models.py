from typing import Optional
from sqlmodel import Field, SQLModel

class StoreInfo(SQLModel, table=True):
    __tablename__ = "store"

    # id를 가장 윗줄에 적으세요. 그러면 JSON에서도 가장 먼저 나옵니다.
    id: Optional[int] = Field(default=None, primary_key=True) 
    
    # 그 다음 순서대로 작성
    name: str
    branch: Optional[str] = None
    category: str
    city: str
    district: str
    address: str
    lon: float
    lat: float
    