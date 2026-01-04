import pandas as pd
from sqlmodel import Session, create_engine, select

LOCAL_DB_URL = "postgresql://postgres:mkscsi31@localhost/study"

NEON_DB_URL = "postgresql://neondb_owner:npg_DRxUAHng3t9h@ep-muddy-field-a12h777r-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def migrate():
    print("🚀 데이터 이전을 시작합니다...")

    # 엔진 생성
    local_engine = create_engine(LOCAL_DB_URL)
    neon_engine = create_engine(NEON_DB_URL)

    try:
        # [Step 1] 로컬에서 데이터 읽기 (read_sql)
        # 로컬 테이블 이름이 'store_info'라고 하셨죠?
        print("📥 로컬 DB에서 데이터를 읽어오는 중...")
        df = pd.read_sql("SELECT * FROM store_info", local_engine)
        
        print(f"   -> 총 {len(df)}개의 데이터를 가져왔습니다.")

        # (선택) 만약 컬럼 이름이 다르다면 바꿔줘야 합니다.
        # 로컬엔 'store_name'인데 새 DB엔 'name'이라면 아래처럼 변경:
        # df.rename(columns={'store_name': 'name'}, inplace=True)
        # (기존 컬럼명과 새 코드의 컬럼명이 같다면 생략 가능)

        # [Step 2] Neon DB로 데이터 쓰기 (to_sql)
        # 새 코드(main.py)의 모델 클래스 이름이 Store이므로, 테이블명은 보통 'store'가 됩니다.
        print("📤 Neon DB로 데이터를 전송하는 중...")
        
        # if_exists='replace': 기존 테이블이 있으면 지우고 새로 만듦
        # if_exists='append': 기존 데이터 뒤에 추가함 (추천)
        # index=False: 판다스의 인덱스 숫자(0,1,2...)는 DB에 넣지 않음
        df.to_sql(name='store', con=neon_engine, if_exists='replace', index=False)
        
        print("✅ 데이터 이전 완료! 완벽합니다.")

    except Exception as e:
        print(f"❌ 오류 발생: {e}")

if __name__ == "__main__":
    migrate()