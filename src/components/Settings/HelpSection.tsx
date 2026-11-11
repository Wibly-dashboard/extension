import { FaExternalLinkAlt } from "react-icons/fa";

// TODO: 실제 문서 사이트 주소로 교체
const DOCS_URL = "https://example.com";

export const HelpSection = () => (
  <div className="flex h-full flex-col items-center justify-center gap-4 py-10 text-center">
    <div>
      <p className="text-base font-semibold text-white">도움이 필요하신가요?</p>
      <p className="mt-1 text-sm text-white/60">위젯 사용법과 자주 묻는 질문은 문서 사이트에서 확인할 수 있습니다.</p>
    </div>
    <a
      href={DOCS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-400"
    >
      문서 사이트로 이동
      <FaExternalLinkAlt className="h-3 w-3" />
    </a>
  </div>
);
