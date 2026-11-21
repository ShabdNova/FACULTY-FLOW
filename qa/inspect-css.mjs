import { chromium } from 'playwright'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.locator('.role-chip', { hasText: 'Student' }).click()
  await page.waitForTimeout(500)
  await page.locator('.nav-link', { hasText: 'Notice Board' }).first().click()
  await page.waitForTimeout(600)

  const info = await page.evaluate(() => {
    const g = document.querySelector('.student-notice-grid')
    const c = document.querySelector('.student-notice-card')
    if (!g || !c) return { found: false }
    const gs = getComputedStyle(g)
    const cs = getComputedStyle(c)
    return {
      found: true,
      gridDisplay: gs.display,
      gridCols: gs.gridTemplateColumns,
      cardBg: cs.backgroundColor,
      cardBorder: cs.borderTopWidth + ' ' + cs.borderTopColor,
      cardRadius: cs.borderRadius,
      cardWidth: c.getBoundingClientRect().width,
      gridWidth: g.getBoundingClientRect().width,
      stylesheets: Array.from(document.styleSheets).map((s) => s.href || '(inline)'),
      hasRule: Array.from(document.styleSheets).some((s) => {
        try {
          return Array.from(s.cssRules).some((r) => r.selectorText === '.student-notice-grid')
        } catch {
          return false
        }
      }),
    }
  })
  console.log(JSON.stringify(info, null, 2))
  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
