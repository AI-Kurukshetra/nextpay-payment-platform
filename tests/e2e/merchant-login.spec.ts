import { expect, test } from "@playwright/test";

test("merchant can login with issued api key", async ({ page }) => {
  const email = `login-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Merchant Name").fill("Login Merchant");
  await page.getByLabel("Email").fill(email);

  const registerResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/v1/auth/register") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Create Account" }).click();
  const registerResponse = await registerResponsePromise;
  expect(registerResponse.ok()).toBeTruthy();

  const registerPayload = (await registerResponse.json()) as { apiKey: string };
  expect(registerPayload.apiKey).toBeTruthy();

  await page.goto("/api/v1/auth/session");
  await page.goto("/login");
  const apiKeyInput = page.locator("#apiKey");
  await apiKeyInput.fill(registerPayload.apiKey);
  await expect(apiKeyInput).toHaveValue(registerPayload.apiKey);
  const loginResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/v1/auth/login") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Sign In" }).click();
  const loginResponse = await loginResponsePromise;
  expect(loginResponse.ok()).toBeTruthy();

  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByText("Merchant Console")).toBeVisible();
});
