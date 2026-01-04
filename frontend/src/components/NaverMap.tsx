import { useEffect, useRef } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    naver: any;
  }
}

interface Store {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

interface NaverMapProps {
  stores: Store[];
  myLat: number | null;
  myLon: number | null;
  onMarkerClick: (id: number) => void;
  selectedId: number | null;
}

export default function NaverMap({ stores, myLat, myLon, onMarkerClick, selectedId }: NaverMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerListRef = useRef<{ [key: number]: any }>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      console.error("Client ID가 없습니다. .env 파일을 확인해주세요.");
      return;
    }

    const scriptId = "naver-map-script";
    const existingScript = document.getElementById(scriptId);

    const initMap = () => {
      if (!window.naver || !mapElement.current) return;

      const centerLat = myLat ?? 36.3504;
      const centerLon = myLon ?? 127.3845;
      const location = new window.naver.maps.LatLng(centerLat, centerLon);

      const mapOptions = {
        center: location,
        zoom: 14,
        zoomControl: true,
      };

      const map = new window.naver.maps.Map(mapElement.current, mapOptions);
      mapRef.current = map; // 지도 객체 저장

      // 정보창 생성
      infoWindowRef.current = new window.naver.maps.InfoWindow({
        backgroundColor: "#fff",
        borderColor: "#ccc",
        borderWidth: 1,
        anchorSize: new window.naver.maps.Size(10, 10),
      });

      // --- 가게 마커 ---
      stores.forEach((store) => {
        const position = new window.naver.maps.LatLng(store.lat, store.lon);
        const marker = new window.naver.maps.Marker({
          position,
          map,
          title: store.name,
        });

        // 마커 저장 (리스트 클릭 시 찾기 위해)
        markerListRef.current[store.id] = marker;

        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, "click", () => {
          onMarkerClick(store.id);
        });
      });

      // --- 내 위치 마커 ---
      if (myLat && myLon) {
        const myPosition = new window.naver.maps.LatLng(myLat, myLon);
        new window.naver.maps.Marker({
          position: myPosition,
          map,
          icon: {
            content: `<div style="width:20px;height:20px;background:red;border-radius:50%;border:3px solid white;box-shadow:0 0 5px rgba(0,0,0,0.5);"></div>`,
            anchor: new window.naver.maps.Point(10, 10),
          },
        });
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      // [사용자 확인 반영] 문서에 따라 ncpKeyId 사용
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
      script.async = true;
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      if (window.naver && window.naver.maps) {
        initMap();
      } else {
        existingScript.onload = () => initMap();
      }
    }
  }, [stores, myLat, myLon, onMarkerClick]);


  // [중요] 리스트 클릭 시 지도 반응 로직
  useEffect(() => {
    if (!selectedId || !mapRef.current || !markerListRef.current[selectedId]) {
      if (!selectedId && infoWindowRef.current) {
         infoWindowRef.current.close();
      }
      return;
    }

    const marker = markerListRef.current[selectedId];
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;

    // 1. 지도 중심 이동
    map.panTo(marker.getPosition());

    // 2. 정보창 띄우기
    const storeName = stores.find(s => s.id === selectedId)?.name;
    const contentString = `<div style="padding:10px;font-weight:bold;">${storeName}</div>`;
    
    infoWindow.setContent(contentString);
    infoWindow.open(map, marker);

  }, [selectedId, stores]);

  return (
    <div 
      ref={mapElement} 
      className="w-full h-[400px] rounded-lg shadow-md border border-gray-300 mt-6"
    />
  );
}