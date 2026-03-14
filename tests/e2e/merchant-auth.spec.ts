import { expect, test } from "@playwright/test";

test("merchant can register and access dashboard", async ({ page }) => {
  const email = `merchant-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Merchant Name").fill("Acme QA");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Create Account" }).click();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByText("Dashboard", { exact: false })).toBeVisible();
});
