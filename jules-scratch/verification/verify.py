import re
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Marketing page
    page.goto("http://localhost:5173")
    page.screenshot(path="jules-scratch/verification/marketing.png")

    # Login
    page.goto("http://localhost:5173/app")
    page.get_by_label("Email address").fill("user@example.com")
    page.get_by_label("Password").fill("password")
    page.get_by_role("button", name="Sign in").click()

    # App - View Expenses
    expect(page).to_have_url(re.compile(".*\/app"))
    page.screenshot(path="jules-scratch/verification/app-view-expenses.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
