import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('text=Products')).toBeVisible();
});

test('login prompt', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('text=Login')).toBeVisible();
});
