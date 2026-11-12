# Spotify 위젯 토큰 가이드

> Spotify 위젯을 로컬(개발 서버)에서 실제 토큰으로 확인하는 방법과, 토큰이 만료되지 않게 운영하는 방법을 정리합니다.

## 현재 상태

- 위젯은 `설정 > 저장소`에 저장된 `spotify` 액세스 토큰으로 `GET /v1/me/player`를 **5초마다** 호출해 곡/아티스트/앨범 커버/진행 시간을 표시합니다. (`src/hooks/useSpotifyPlayback.ts`)
- 셔플, 이전/다음 곡, 재생/일시정지, 반복 버튼은 Spotify API로 실제 재생을 제어합니다. (Premium 필요)
- 리프레시 토큰 자동 갱신은 아직 없습니다. 1시간 뒤 "토큰이 만료되었거나 올바르지 않습니다"가 뜨면 1-6으로 재발급해 다시 입력합니다.
- 위젯이 보이지 않으면 하단 바 `+` → 위젯 추가 창에서 **Spotify**를 추가합니다. (기본 제공 위젯은 없음)

| 위젯 표시                             | 원인                                          |
| ------------------------------------- | --------------------------------------------- |
| Spotify 연결이 필요합니다             | 저장소에 토큰 없음                            |
| 토큰이 만료되었거나 올바르지 않습니다 | 401 — 만료(1시간) 또는 잘못 복사한 토큰       |
| 접근 권한이 없습니다                  | 403 — scope 부족 또는 User Management 미등록  |
| 재생 중인 기기가 없습니다             | 204 — Spotify 앱에서 아무 곡도 재생하지 않음  |

## 필요한 토큰

| 항목      | 값                                                                                        |
| --------- | ----------------------------------------------------------------------------------------- |
| 토큰 종류 | **사용자 액세스 토큰** (Authorization Code 흐름). Client Credentials 토큰은 사용자 정보 접근 불가 |
| scope     | `user-read-currently-playing` `user-read-playback-state` `user-modify-playback-state`      |
| 유효 시간 | 액세스 토큰 **1시간** (`expires_in: 3600`)                                                  |
| 주요 API  | `GET https://api.spotify.com/v1/me/player/currently-playing`                              |

- `user-modify-playback-state`(재생/일시정지, 이전/다음 곡)는 **Spotify Premium** 계정에서만 동작합니다.

---

## 1. 로컬에서 확인하기 (개발용)

### 1-1. Spotify 앱 만들기

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)에 로그인 → **Create app**
2. **Redirect URIs**에 아래 주소를 등록
   ```
   http://127.0.0.1:5173/callback
   ```
   - ⚠️ Spotify는 `localhost`를 Redirect URI로 허용하지 않습니다. 반드시 루프백 IP(`127.0.0.1`)를 사용합니다.
3. **Which API/SDKs are you planning to use?** → `Web API` 선택
4. 생성 후 **Settings**에서 `Client ID`, `Client secret` 확인
5. 개발 모드 앱은 등록된 계정만 로그인할 수 있으므로 **User Management**에 본인 Spotify 계정 이메일을 추가

### 1-2. 개발 서버를 127.0.0.1로 실행

Vite 기본 주소는 `localhost`인데, Windows에서는 IPv6(`::1`)로만 열려 `127.0.0.1` 접속이 안 될 수 있습니다.

```bash
npm run dev -- --host 127.0.0.1
```

브라우저에서도 `http://localhost:5173`이 아니라 **`http://127.0.0.1:5173`** 으로 접속합니다.

### 1-3. 인증 코드 받기

브라우저 주소창에 아래 URL을 입력합니다. (`<CLIENT_ID>`만 교체)

```
https://accounts.spotify.com/authorize?client_id=<CLIENT_ID>&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A5173%2Fcallback&scope=user-read-currently-playing%20user-read-playback-state%20user-modify-playback-state
```

동의하면 `http://127.0.0.1:5173/callback?code=AQB...` 로 이동합니다. 주소창의 **`code` 값**을 복사합니다.

- 코드는 **한 번만, 짧은 시간 동안**만 사용할 수 있으므로 바로 다음 단계를 진행합니다.

### 1-4. 액세스 토큰 / 리프레시 토큰 받기

> Windows PowerShell 5.1에서 `curl`은 다른 명령의 별칭입니다. **`curl.exe`** 로 실행하거나 Git Bash를 사용하세요.

```bash
curl.exe -X POST https://accounts.spotify.com/api/token \
  -u "<CLIENT_ID>:<CLIENT_SECRET>" \
  -d grant_type=authorization_code \
  -d code=<1-3에서 받은 code> \
  -d redirect_uri=http://127.0.0.1:5173/callback
```

응답 예시:

```json
{
  "access_token": "BQD...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "AQC...",
  "scope": "user-read-currently-playing user-read-playback-state user-modify-playback-state"
}
```

- `access_token` → `설정 > 저장소 > Spotify`에 입력
- `refresh_token` → 따로 보관 (1시간 뒤 재발급할 때 사용)

### 1-5. 토큰이 동작하는지 확인

Spotify 앱에서 아무 곡이나 재생한 상태로:

```bash
curl.exe -H "Authorization: Bearer <access_token>" https://api.spotify.com/v1/me/player/currently-playing
```

| 응답               | 의미                                     |
| ------------------ | ---------------------------------------- |
| `200` + JSON       | 정상. `item.name`, `item.artists` 등 확인 |
| `204` (본문 없음)  | 토큰은 정상, 재생 중인 곡 없음            |
| `401`              | 토큰 만료/잘못됨 → 1-6으로 재발급          |
| `403`              | scope 부족 또는 User Management 미등록     |

### 1-6. 1시간 뒤 토큰 재발급 (수동)

```bash
curl.exe -X POST https://accounts.spotify.com/api/token \
  -u "<CLIENT_ID>:<CLIENT_SECRET>" \
  -d grant_type=refresh_token \
  -d refresh_token=<refresh_token>
```

새 `access_token`을 저장소에 다시 입력합니다. 응답에 `refresh_token`이 함께 오면 **새 값으로 교체**해서 보관합니다.

> ⚠️ `Client secret`과 `refresh_token`은 커밋하지 마세요. 로컬 터미널에서만 사용합니다. (`*.local` 파일은 `.gitignore`에 포함되어 있습니다)

---

## 2. 토큰이 만료되지 않게 하려면 (실제 구현)

**액세스 토큰 자체의 만료(1시간)는 막을 수 없습니다.** 대신 **리프레시 토큰으로 자동 재발급**해서 사용자는 처음 한 번만 로그인하면 되도록 만듭니다.

### 2-1. 인증 방식: Authorization Code + PKCE

- 확장 프로그램 코드는 누구나 열어볼 수 있으므로 **`Client secret`을 코드에 넣으면 안 됩니다.**
- PKCE는 secret 없이 `code_verifier` / `code_challenge`로 인증하는 방식이며, Spotify가 클라이언트 앱에 권장하는 방식입니다.
- 토큰 요청 시 `-u CLIENT_ID:SECRET` 대신 본문에 `client_id`와 `code_verifier`를 보냅니다.

### 2-2. 흐름

```
[Spotify 연결 버튼]
   │  code_verifier 생성 → SHA-256 → code_challenge
   ▼
authorize (code_challenge_method=S256)
   │  사용자 로그인/동의
   ▼
redirect_uri?code=...
   │  POST /api/token (grant_type=authorization_code, code, code_verifier, client_id)
   ▼
access_token + refresh_token + expires_in 저장
   │
   ├─ API 호출 전: 만료 1분 전이면 미리 재발급
   └─ API가 401 응답: 재발급 후 1회 재시도
         POST /api/token (grant_type=refresh_token, refresh_token, client_id)
         → 새 access_token 저장, 응답에 새 refresh_token이 있으면 교체 저장
```

### 2-3. 저장 형식 (예정)

현재 `ServiceToken`은 `{ token, updatedAt }`만 있으므로 아래처럼 확장합니다.

```ts
type SpotifyToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Date.now() + expires_in * 1000
};
```

### 2-4. 환경별 Redirect URI

| 환경                         | Redirect URI                                 | 로그인 창 열기                          |
| ---------------------------- | -------------------------------------------- | --------------------------------------- |
| 개발 서버 (`npm run dev`)    | `http://127.0.0.1:5173/callback`             | `location.href`로 이동 후 콜백에서 처리 |
| 크롬 확장 (`dist` 로드)      | `https://<확장프로그램 ID>.chromiumapp.org/` | `chrome.identity.launchWebAuthFlow`     |

- 두 주소 모두 Spotify Dashboard의 Redirect URIs에 등록해 둡니다.
- 확장 프로그램 방식은 `manifest.json`의 `permissions`에 `"identity"`를 추가해야 합니다.
- 확장 프로그램 ID는 `chrome://extensions`에서 확인합니다. (압축 해제 로드 시 폴더 경로에 따라 바뀔 수 있으므로 `manifest.json`에 `key`를 지정해 고정하는 것을 권장)

### 2-5. 그래도 다시 로그인해야 하는 경우

리프레시 토큰은 고정된 만료 시간이 없지만 아래 경우 무효화됩니다. 이때 재발급이 `400 invalid_grant`로 실패하면 저장된 토큰을 지우고 "Spotify 연결이 필요합니다" 화면을 보여줍니다.

- 사용자가 [Spotify 계정 > 앱 관리](https://www.spotify.com/account/apps/)에서 접근 권한을 제거한 경우
- 앱의 scope를 변경해 다시 동의가 필요한 경우
- 이미 사용한(교체된) 이전 리프레시 토큰으로 요청한 경우

---

## 3. 배포 전 확인 사항

- 개발 모드 앱은 **User Management에 등록한 계정(최대 25명)** 만 사용할 수 있습니다.
- 일반 사용자에게 배포하려면 Spotify에 확장 할당량(Extended Quota) 승인을 받아야 하며, 승인 조건이 까다로우므로 [Spotify 개발자 정책](https://developer.spotify.com/policy)을 먼저 확인합니다.
