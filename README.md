<div align="center">
<img src="./src/assets/imgs/logo.png" width="90" />
</div>

<!-- <p align="center">
  <img src="https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-6.0.2-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.3.0-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3.3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Storybook-10.6.2-FF4785?logo=storybook&logoColor=white" alt="Storybook" />
  <img src="https://img.shields.io/badge/ESLint-10.10.0-4B32C3?logo=eslint&logoColor=white" alt="ESLint" />
  <img src="https://img.shields.io/badge/React_Draggable-4.7.2-61DAFB?logo=react&logoColor=white" alt="React Draggable" />
</p> -->

<h1 align="center">Wibly Dashboard</h1>

<p align="center">
  <strong>필요한 정보를 한 화면에 모아 보고, 위젯을 원하는 위치에 자유롭게 배치하세요.</strong>
</p>

## 프로젝트 소개

Wibly는 Chrome 새 탭에서 사용할 수 있는 위젯 대시보드입니다.<br>
위젯을 한 화면에 배치하고, 드래그 앤 드롭으로 원하는 위치에 정리할 수 있습니다.

## 주요 기능

- 위젯 기반 대시보드 레이아웃
- 위젯 드래그 및 커스텀 단위 그리드 스냅
- 위젯 간 충돌 방지 및 빈 위치 탐색
- 컨테이너 크기와 위젯 크기를 감지하는 반응형 위치 조정
- 위젯을 컨테이너 가로 중앙에 맞추는 자석형 중앙 스냅
- 내부 위젯과 외부 서비스 위젯을 확장할 수 있는 구조

## 제공 위젯

제공하는 위젯의 예시 종류는 다음과 같습니다.

- 디지털 시계
- 투두 리스트
- 디데이
- 포모도로

더 많은 위젯을 보고 싶으시다면 [문서]()를 참고해주세요.

## 설치

1. [Releases](../../releases)에서 최신 릴리스 압축 파일을 내려받습니다.
2. 압축 파일을 해제합니다.
3. Chrome에서 `chrome://extensions`를 엽니다.
4. 우측 상단의 **개발자 모드**를 활성화합니다.
5. **압축해제된 확장 프로그램을 로드**를 선택합니다.
6. `manifest.json` 파일이 있는 폴더를 선택합니다.

## 프로젝트 구조

```text
src/
├── components/
│   ├── Body/       # 대시보드와 위젯 배치 로직
│   ├── Footer/     # 하단 네비게이션
│   └── Widgets/    # 개별 위젯 컴포넌트
├── assets/         # 이미지와 폰트
├── data/           # 위젯에 사용하는 정적 데이터
└── stories/        # Storybook 스토리
```

## 기여하기

Wibly는 여러분의 아이디어로 함께 자라는 프로젝트입니다.

깃허브 이슈 생성을 통해 개선 점이나 있으면 좋겠다는 위젯 아이디어를 제공해주세요.

---
