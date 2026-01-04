import os
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select
from typing import List
import math

from database import get_session
from models import StoreInfo

# [수정] 환경변수에서 DATABASE_URL을 가져오도록 변경
# 배포 환경에서는 os.environ.get("DATABASE_URL")이 사용되고,
# 로컬 개발 환경에서는 뒤에 적힌 "postgresql://..." 부분이 사용됩니다.
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:mkscsi31@localhost:5432/study")

# 만약 URL이 'postgres://'로 시작하면 'postgresql://'로 바꿔줍니다. (Render/Neon 호환성 문제 해결)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- [유틸리티 함수] 거리 계산 (Haversine Formula) ---
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # 지구 반지름 (km)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) * math.sin(dlon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c # 거리 (km 반환)


# --- [API 1] 전체 매장 조회 (기본) ---
@app.get("/stores/", response_model=List[StoreInfo])
def read_stores(session: Session = Depends(get_session), limit: int = 100):
    statement = select(StoreInfo).limit(limit)
    return session.exec(statement).all()


# --- [API 2] 내 주변 가까운 매장 찾기 ---
# 사용법 예시: /stores/nearest?lat=36.35&lon=127.38 (대전 시청 근처)
@app.get("/stores/nearest")
def get_nearest_stores(
    lat: float, 
    lon: float, 
    session: Session = Depends(get_session)
):
    # 1. 모든 매장 데이터를 가져옵니다. (데이터가 수십만 건이면 DB 쿼리로 거리 계산하는 게 좋음)
    stores = session.exec(select(StoreInfo)).all()
    
    # 2. Python 리스트 컴프리헨션으로 거리 계산 후 정렬
    # (매장정보, 거리) 튜플 형태로 변환
    store_distances = []
    for store in stores:
        dist = calculate_distance(lat, lon, store.lat, store.lon)
        store_distances.append({
            "store": store,
            "distance_km": round(dist, 2) # 소수점 2자리까지
        })
    
    # 3. 거리순으로 오름차순 정렬 (가까운 순)
    store_distances.sort(key=lambda x: x["distance_km"])
    
    # 4. 상위 5개만 잘라서 반환
    return store_distances[:5]