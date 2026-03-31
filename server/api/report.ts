const REPO = "zhuantouer/newsnow"
const BRANCH = "main"

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const path = query.path as string
    if (!path || !path.endsWith(".md")) {
      throw createError({ statusCode: 400, message: "Invalid path" })
    }

    // Fetch raw markdown from GitHub
    const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${path}`
    const content: string = await myFetch(rawUrl, {
      headers: {
        "User-Agent": "newsnow",
        "Accept": "text/plain",
      },
      responseType: "text",
    })

    return {
      content,
      path,
    }
  } catch (e: any) {
    logger.error(e)
    throw createError({
      statusCode: 500,
      message: e instanceof Error ? e.message : "Failed to fetch report",
    })
  }
})
