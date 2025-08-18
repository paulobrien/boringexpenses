from playwright.sync_api import sync_playwright, TimeoutError

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 375, 'height': 667}  # iPhone 8
    )
    page = context.new_page()

    try:
        page.goto("http://localhost:5173/app")
        page.wait_for_selector('input[type="email"]')
        page.fill('input[type="email"]', 'test@example.com')
        page.click('button[type="submit"]')

        page.wait_for_selector('input[type="text"]')
        page.fill('input[type="text"]', '123456')
        page.click('button[type="submit"]')

        page.wait_for_url("http://localhost:5173/app", timeout=5000)

        # Add some content to make the page scrollable
        page.evaluate('''() => {
            const container = document.querySelector('.p-4.lg\\:p-8.pb-20.lg\\:pb-8');
            if (container) {
                for (let i = 0; i < 20; i++) {
                    const p = document.createElement('p');
                    p.textContent = 'This is a long line of text to make the page scroll. Line ' + (i + 1);
                    p.style.marginBottom = '20px';
                    container.appendChild(p);
                }
            }
        }''')

        page.screenshot(path="jules-scratch/verification/verification.png")
    except TimeoutError as e:
        print("Timeout error:", e)
        page.screenshot(path="jules-scratch/verification/error.png")
        print(page.content())
        raise
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
