const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

export async function launchBrowser() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const { default: chromium } = await import('@sparticuz/chromium')
    const puppeteer = await import('puppeteer-core')
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1200, deviceScaleFactor: 1 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  }
  const { launch } = await import('puppeteer')
  return launch({
    defaultViewport: { width: 1080, height: 1200, deviceScaleFactor: 1 },
    headless: true,
    executablePath: CHROME_PATH,
  })
}
