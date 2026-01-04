import { useState, useEffect, useRef, useCallback } from "react";
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
  
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const itemRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const loadStoreData = () => {
    // [수정 1] 끝에 슬래시(/) 추가 (CORS/Redirect 문제 방지)
    fetch("https://store-backend-woil.onrender.com/stores/")
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
    setSelectedId(null);
    loadStoreData();
  };

  const fetchNearestStores = () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }
    setLoading(true);
    setSelectedId(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setMyLoc({ lat, lon });

        // [수정 2] 경로 누락 수정! (/stores/nearest 추가)
        fetch(`https://store-backend-woil.onrender.com/stores/nearest?lat=${lat}&lon=${lon}`)
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

        // [수정 3] 여기도 혹시 모르니 경로 확인
        fetch(`https://store-backend-woil.onrender.com/stores/nearest?lat=${defaultLat}&lon=${defaultLon}`)
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

  useEffect(() => {
    if (selectedId && itemRefs.current[selectedId]) {
      itemRefs.current[selectedId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
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
            📍 내 주변 10곳 + 지도
          </button>
        </div>

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
              ref={(el) => { itemRefs.current[store.id] = el; }}
              onClick={() => setSelectedId(store.id)}
              className={`p-6 rounded-lg shadow-md border cursor-pointer transition-all ${
                selectedId === store.id 
                  ? "ring-4 ring-blue-400 bg-blue-50 border-blue-500 scale-105"
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