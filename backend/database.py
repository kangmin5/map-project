# database.py
import os
from sqlmodel import create_engine, Session

# 1. 환경 변수에서 URL 가져오기 (없으면 localhost 사용)
# ★★★ 여기가 가장 중요합니다! ★★★
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:mkscsi31@localhost/study")

# 2. Render/Neon 호환성 패치 (postgres:// -> postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. 엔진 생성
engine = create_engine(DATABASE_URL)

# 4. 세션 생성 함수
def get_session():
    with Session(engine) as session:
        yield session