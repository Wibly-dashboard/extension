import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initStorage } from './hooks/storage'

// 확장 프로그램이면 브라우저 저장소(chrome.storage.local)를 먼저 읽어 둔 뒤 렌더링한다 (localhost에서는 즉시 완료)
void initStorage().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
