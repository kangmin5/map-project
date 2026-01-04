import os
from sqlmodel import create_engine, Session

# 1. 환경 변수에서 URL 가져오기 (main.py에 있던 로직을 여기로!)
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:mkscsi31@localhost/study")

# 2. Render/Neon 호환성 패치
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# 3. 엔진 생성 (여기서 만든 엔진이 진짜입니다)
engine = create_engine(DATABASE_URL)

# 4. 세션 생성 함수
def get_session():
    with Session(engine) as session:
        yield session