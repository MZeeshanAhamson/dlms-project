import { expect, test } from "@playwright/test";

test("redirects anonymous users and signs in an administrator", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Email address").fill("admin@dlms.test");
  await page.getByLabel("Password").fill(process.env.DEMO_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("System administration")).toBeVisible();
});

test("does not expose Admin navigation to a specialist", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("examiner@dlms.test");
  await page.getByLabel("Password").fill(process.env.DEMO_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("link", { name: "Users" })).toHaveCount(0);
  await page.goto("/admin/users");
  await expect(page).toHaveURL(/\/forbidden/);
});
