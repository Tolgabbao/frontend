import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.locator('input[name="username"]').click();
  await page.locator('input[name="username"]').fill('test');
  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').fill('test@gamil.com');
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill('123456');
  await page.locator('input[name="confirmPassword"]').click();
  await page.locator('input[name="confirmPassword"]').fill('123456');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('navigation').getByRole('link', { name: 'Login' })).toBeVisible();
});