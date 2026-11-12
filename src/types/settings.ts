export type LinkTarget = "_blank" | "_self";

export type Background =
  | { type: "default" } // 기본 제공 배경 이미지
  | { type: "color"; value: string } // 단색 배경 (hex)
  | { type: "image"; value: string }; // 업로드한 이미지 (data URL)

export type DashboardSettings = {
  gridSnap: boolean; // 위젯을 그리드에 맞춰 정렬할지 여부
  gridSize: number; // 그리드 한 칸의 크기(px)
  widgetGap: number; // 위젯 사이 최소 간격(px)
  fontColor: string; // 대시보드 글자 색 (hex)
  linkTarget: LinkTarget; // 웹 사이트를 새 탭 / 현재 탭 중 어디에서 열지
  background: Background;
};

// 외부 API 위젯이 사용하는 서비스 식별자
export type ServiceId = "spotify" | "google-calendar";

export type ServiceToken = {
  token: string;
  updatedAt: string; // ISO 8601
};

// 연결된 서비스만 키로 존재한다
export type TokenMap = Partial<Record<ServiceId, ServiceToken>>;

// 하단 네비게이터에 표시되는 링크 아이콘
export type NavLink = {
  id: string;
  imageUrl: string; // 아이콘 이미지 URL
  href: string; // 이동할 웹 사이트 URL
};
