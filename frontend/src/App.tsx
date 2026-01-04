import { useState, useEffect, useRef, useCallback } from "react"; // useRef, useCallback 추가
import NaverMap from "./components/NaverMap";

interface Store {
  id: number;
  name: string;
  category: string;
  address: string;
  district: string;
  lat: number;
  lon: number;
  distance_km?: number;
}

interface NearestResponse {
  store: Store;
  distance_km: number;
}

function App() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"all" | "nearest">("all");
  const [myLoc, setMyLoc] = useState<{lat: number, lon: number} | null>(null);
  
  // [추가] 현재 선택된 가게 ID 상태
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // [추가] 리스트 아이템들의 DOM 요소(div)를 저장할 Ref
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const loadStoreData = () => {
    fetch("http://172.30.1.66:8000/stores/")
      .then((res) => res.json())
      .then((data) => {
        setStores(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
      });
  };

  const fetchAllStores = () => {
    setLoading(true);
    setMode("all");
    setMyLoc(null);
    setSelectedId(null); // 초기화
    loadStoreData();
  };

  const fetchNearestStores = () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }
    setLoading(true);
    setSelectedId(null); // 초기화

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setMyLoc({ lat, lon });

        fetch(`http://172.30.1.66:8000/stores/nearest?lat=${lat}&lon=${lon}`)
          .then((res) => res.json())
          .then((data: NearestResponse[]) => {
            const formattedData = data.map((item) => ({
              ...item.store,
              distance_km: item.distance_km,
            }));
            setStores(formattedData);
            setMode("nearest");
            setLoading(false);
          });
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("위치 정보를 가져올 수 없어 대전 시청 기준으로 검색합니다.");
        const defaultLat = 36.3504;
        const defaultLon = 127.3845;
        setMyLoc({ lat: defaultLat, lon: defaultLon });

        fetch(`http://172.30.1.66:8000/stores/nearest?lat=${defaultLat}&lon=${defaultLon}`)
          .then((res) => res.json())
          .then((data: NearestResponse[]) => {
             const formattedData = data.map((item) => ({
              ...item.store,
              distance_km: item.distance_km,
            }));
            setStores(formattedData);
            setMode("nearest");
            setLoading(false);
          });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // [추가] selectedId가 바뀌면 해당 요소로 스크롤 이동
  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth", // 부드럽게 스크롤
        block: "center",    // 화면 중앙에 오도록
      });
    }
  }, [selectedId]);

  const handleMarkerClick = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          🏙️ 대전 매장 지도
        </h1>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={fetchAllStores}
            className={`px-4 py-2 rounded-full font-bold transition-colors ${
              mode === "all" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-blue-600"
            }`}
          >
            전체 목록
          </button>
          <button
            onClick={fetchNearestStores}
            className={`px-4 py-2 rounded-full font-bold transition-colors ${
              mode === "nearest" ? "bg-green-600 text-white" : "bg-white text-green-600 border border-green-600"
            }`}
          >
            📍 내 주변 5곳 + 지도
          </button>
        </div>

        {/* [수정] onMarkerClick 전달 */}
        <NaverMap 
          stores={stores} 
          myLat={myLoc?.lat || null} 
          myLon={myLoc?.lon || null}
          onMarkerClick={handleMarkerClick}
          selectedId={selectedId}
        />
      </div>

      {loading ? (
        <p className="text-center text-lg animate-pulse">데이터를 불러오는 중입니다...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8">
          {stores.map((store) => (
            <div
              key={store.id}
              // [추가] 각 카드의 DOM을 ref에 저장
              ref={(el) => { itemRefs.current[store.id] = el; }}
              
              // [수정] 클릭 시에도 선택 상태 변경
              onClick={() => setSelectedId(store.id)}

              // [수정] 선택된 항목은 테두리를 굵고 파랗게(ring) 표시
              className={`p-6 rounded-lg shadow-md border cursor-pointer transition-all ${
                selectedId === store.id 
                  ? "ring-4 ring-blue-400 bg-blue-50 border-blue-500 scale-105" // 선택됐을 때 스타일
                  : store.distance_km 
                    ? "border-green-200 bg-green-50 hover:bg-green-100" 
                    : "border-gray-200 bg-white hover:bg-gray-100"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold text-gray-900">{store.name}</h2>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                  {store.category}
                </span>
              </div>
              <p className="text-gray-600 mb-1">{store.address}</p>
              <div className="flex justify-between items-center mt-3">
                <p className="text-sm text-gray-400 font-medium">{store.district}</p>
                {store.distance_km !== undefined && (
                  <span className="text-green-700 font-bold text-sm">
                    📏 {store.distance_km.toFixed(2)} km
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;