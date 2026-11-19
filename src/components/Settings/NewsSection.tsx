import Markdown, { type Components } from "react-markdown";
import whatsNew from "../../data/WHATS_NEW.md?raw";

// 마크다운 요소별 Tailwind 스타일
const components: Components = {
  h1: ({ children }) => <h1 className="mt-2 mb-3 text-xl font-bold text-white">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-5 mb-2 text-base font-bold text-white">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 mb-1.5 text-sm font-semibold text-white">{children}</h3>,
  p: ({ children }) => <p className="my-2 text-sm leading-relaxed text-white/85">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 text-sm text-white/85">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 text-sm text-white/85">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-white">{children}</code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-white/40 pl-3 text-white/70">{children}</blockquote>
  ),
  hr: () => <hr className="my-5 border-white/15" />,
};

export const NewsSection = () => (
  // 내용 길이와 관계없이 높이를 고정하고, 넘치는 내용은 스크롤로 본다
  <article className="h-[480px] max-h-[65vh] overflow-y-auto py-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    <Markdown components={components}>{whatsNew}</Markdown>
  </article>
);
