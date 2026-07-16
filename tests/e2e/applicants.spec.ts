import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(process.env.DEMO_USER_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("creates, retrieves, updates, and protects an applicant photo", async ({ page, browser }) => {
  await login(page, "data.entry@dlms.test");
  await page.goto("/applicants/new");
  await page.getByLabel("CNIC").fill("37405-7654321-3");
  await page.getByLabel("Mobile phone").fill("0300 9876543");
  await page.getByLabel("Legal name").fill("Ayesha Registry Test");
  await page.getByLabel("Father / spouse name").fill("Muhammad Registry Test");
  await page.getByLabel("Date of birth").fill("1995-05-15");
  await page.getByLabel("Gender").selectOption("FEMALE");
  await page.getByLabel("Nationality").selectOption({ label: "Pakistani" });
  await page.getByLabel("Blood group").selectOption({ label: "A+" });
  await page.getByLabel("Province / territory").selectOption({ label: "Punjab" });
  await page.getByLabel("Full address").fill("Model Town, Lahore, Punjab");
  await page.getByRole("button", { name: "Create applicant" }).click();
  await expect(page.getByRole("status")).toContainText("Applicant created");

  await page.goto("/applicants?cnic=37405-7654321-3");
  await expect(page.getByText("Ayesha Registry Test").first()).toBeVisible();
  await page.getByRole("link", { name: /Open applicant/ }).click();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZpWQAAAAASUVORK5CYII=", "base64");
  await page.getByLabel(/JPEG, PNG, or WebP/).setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: /Upload \/ replace photo/ }).click();
  await expect(page.getByRole("status")).toContainText("Photo uploaded");
  const image = page.getByRole("img", { name: /identity photograph/ });
  await expect(image).toBeVisible();
  const source = await image.getAttribute("src");
  const photoId = source?.split("/").pop();
  expect(photoId).toBeTruthy();

  const examinerContext = await browser.newContext();
  const examinerPage = await examinerContext.newPage();
  await login(examinerPage, "examiner@dlms.test");
  const response = await examinerContext.request.get(`/api/files/${photoId}`, { maxRedirects: 0 });
  expect(response.status()).toBe(403);
  await examinerContext.close();
});
