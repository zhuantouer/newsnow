import type { NewsItem } from "@shared/types"

const REPO = "zhuantouer/newsnow"
const BRANCH = "main"

interface GithubFile {
  name: string
  sha: string
  download_url: string
}

async function fetchReports(dir: string, prefix: string, emoji: string): Promise<NewsItem[]> {
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${dir}?ref=${BRANCH}`

  let files: GithubFile[]
  try {
    files = await myFetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "newsnow",
      },
    }) as GithubFile[]
  } catch {
    return []
  }

  if (!Array.isArray(files)) return []

  return files
    .filter(f => f.name.endsWith(".md"))
    .sort((a, b) => b.name.localeCompare(a.name))
    .slice(0, 30)
    .map((f) => {
      const dateMatch = f.name.match(/(\d{8})/)
      const dateStr = dateMatch
        ? `${dateMatch[1].slice(0, 4)}-${dateMatch[1].slice(4, 6)}-${dateMatch[1].slice(6, 8)}`
        : ""
      return {
        id: f.sha,
        title: `${emoji} ${dateStr} ${prefix}`,
        url: `/report/${dir}/${f.name}`,
        extra: {
          date: dateStr,
          info: dateStr,
        },
      }
    })
}

const finance = defineSource(async () => {
  return fetchReports("reports/finance", "全球财经头版要闻", "📰")
})

const ai = defineSource(async () => {
  return fetchReports("reports/tech-ai", "科技AI热点汇总", "🤖")
})

export default defineSource({
  "xiaoq": finance,
  "xiaoq-finance": finance,
  "xiaoq-ai": ai,
})
