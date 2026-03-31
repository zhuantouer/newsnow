import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { OverlayScrollbar } from "~/components/common/overlay-scrollbar"

export const Route = createFileRoute("/report/$")({
  component: ReportPage,
})

function ReportPage() {
  const { _splat: splat } = Route.useParams()
  const path = splat ?? ""

  const { data, isLoading, isError } = useQuery({
    queryKey: ["report", path],
    queryFn: async () => {
      const res: { content: string, path: string } = await myFetch(`/report?path=${encodeURIComponent(path)}`)
      return res
    },
    enabled: !!path,
    staleTime: 5 * 60 * 1000,
  })

  // Simple markdown to HTML (handles headers, bold, tables, links, lists, code blocks, blockquotes)
  const html = useMemo(() => {
    if (!data?.content) return ""
    return markdownToHtml(data.content)
  }, [data?.content])

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="flex items-center gap-1 text-sm op-60 hover:op-100 transition-all cursor-pointer">
          <span className="i-ph:arrow-left-duotone" />
          <span>返回首页</span>
        </Link>
      </div>
      <OverlayScrollbar
        className="bg-base bg-op-70! rounded-2xl p-6 md:p-8"
        options={{ overflow: { x: "hidden" } }}
        defer
      >
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="i-ph:circle-dashed-duotone animate-spin text-2xl op-50" />
            <span className="ml-2 op-50">加载中...</span>
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center py-20 text-red-500">
            <span className="i-ph:warning-duotone text-2xl" />
            <span className="ml-2">加载失败</span>
          </div>
        )}
        {html && (
          <article
            className="report-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </OverlayScrollbar>
    </div>
  )
}

function markdownToHtml(md: string): string {
  let html = md
    // Remove emoji-heavy title prefix for cleaner rendering
    .replace(/^---$/gm, "<hr/>")

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="report-code"><code>${escapeHtml(code.trim())}</code></pre>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code class=\"report-inline-code\">$1</code>")

  // Tables
  html = html.replace(/((?:\|.+\|\n)+)/g, (table) => {
    const rows = table.trim().split("\n")
    if (rows.length < 2) return table
    const header = rows[0]
    const isSeparator = (r: string) => /^\|[\s\-:|]+\|$/.test(r.trim())
    const dataRows = rows.filter((_, i) => i === 0 || !isSeparator(rows[i]))
    let result = "<table class=\"report-table\"><thead><tr>"
    header.split("|").filter(Boolean).forEach((cell) => {
      result += `<th>${cell.trim()}</th>`
    })
    result += "</tr></thead><tbody>"
    dataRows.slice(1).forEach((row) => {
      result += "<tr>"
      row.split("|").filter(Boolean).forEach((cell) => {
        result += `<td>${cell.trim()}</td>`
      })
      result += "</tr>"
    })
    result += "</tbody></table>"
    return result
  })

  // Blockquotes
  html = html.replace(/^>\s*(.+)$/gm, "<blockquote class=\"report-quote\">$1</blockquote>")

  // Headers
  html = html.replace(/^######\s+(.+)$/gm, "<h6 class=\"report-h6\">$1</h6>")
  html = html.replace(/^#####\s+(.+)$/gm, "<h5 class=\"report-h5\">$1</h5>")
  html = html.replace(/^####\s+(.+)$/gm, "<h4 class=\"report-h4\">$1</h4>")
  html = html.replace(/^###\s+(.+)$/gm, "<h3 class=\"report-h3\">$1</h3>")
  html = html.replace(/^##\s+(.+)$/gm, "<h2 class=\"report-h2\">$1</h2>")
  html = html.replace(/^#\s+(.+)$/gm, "<h1 class=\"report-h1\">$1</h1>")

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\" target=\"_blank\" class=\"report-link\">$1</a>")

  // Unordered lists
  html = html.replace(/^[-*]\s+(.+)$/gm, "<li class=\"report-li\">$1</li>")
  html = html.replace(/((?:<li class="report-li">.*<\/li>\n?)+)/g, "<ul class=\"report-ul\">$1</ul>")

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, "<li class=\"report-oli\">$1</li>")
  html = html.replace(/((?:<li class="report-oli">.*<\/li>\n?)+)/g, "<ol class=\"report-ol\">$1</ol>")

  // Paragraphs (lines that aren't already HTML)
  html = html.replace(/^(?!<[a-z/])(.+)$/gm, (_, line) => {
    if (line.trim()) return `<p>${line}</p>`
    return ""
  })

  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
