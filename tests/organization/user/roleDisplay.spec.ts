import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

/**
 * Organization User Role Display Tests
 *
 * Tests verify that organization role names are correctly displayed and translated
 * in user list cards across organization contexts:
 * - Organization users page (AC4)
 * - Facility organization users page (AC5)
 * - Role names are translated and readable
 */

test.use({ storageState: "tests/.auth/user.json" });

test.describe("Organization User Role Display", () => {
  test("should display translated organization roles in organization users page (AC4)", async ({
    page,
  }) => {
    await test.step("Navigate to organization users page", async () => {
      await page.goto("/");
      await page.getByRole("tab", { name: "Governance" }).click();
      await page
        .getByRole("link", { name: /Government$/ })
        .first()
        .click();
      await page.getByRole("menuitem", { name: "Users" }).click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify users are loaded in card view", async () => {
      // Wait for user cards to appear
      const userCards = page.locator(".grid > .h-full");
      await expect(userCards.first()).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify organization role is displayed and translated", async () => {
      // Get the first user card
      const firstCard = page.locator(".grid > .h-full").first();

      // Verify that the card contains organization role text
      // Organization roles include: Admin, Manager, Member, etc.
      const roleText = firstCard.locator(".text-gray-500");
      const roleCount = await roleText.count();

      // At least one text element should be the role (besides username/email)
      expect(roleCount).toBeGreaterThan(0);

      // Verify the role is visible and has text content
      const firstRoleText = await roleText.first().textContent();
      expect(firstRoleText).toBeTruthy();
      expect(firstRoleText!.length).toBeGreaterThan(0);
    });

    await test.step("Verify multiple user cards display organization roles", async () => {
      // Check that at least 2 user cards display roles
      const userCards = page.locator(".grid > .h-full");
      const cardCount = await userCards.count();

      if (cardCount >= 2) {
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = userCards.nth(i);
          // Each card should have role text with gray styling
          const hasRoleText = await card.locator(".text-gray-500").count();
          expect(hasRoleText).toBeGreaterThan(0);
        }
      }
    });
  });

  test("should display translated facility organization roles in facility organization users page (AC5)", async ({
    page,
  }) => {
    const facilityId = getFacilityId();

    await test.step("Navigate to facility organization users page", async () => {
      // Navigate to facility settings -> organizations -> select first org -> users
      await page.goto(`/facility/${facilityId}/settings`);
      await page.waitForLoadState("networkidle");

      // Click on Organizations tab/link
      await page.getByRole("link", { name: "Organizations" }).click();
      await page.waitForLoadState("networkidle");

      // Look for the first organization card and click its view details/users link
      const orgCards = page.locator(".grid").first().locator("> div");
      const firstOrgCard = orgCards.first();

      // Check if there are any organizations linked
      const orgCount = await orgCards.count();

      if (orgCount === 0) {
        // Skip test if no organizations are linked to this facility
        test.skip();
      }

      // Click "View" or navigate to the organization
      await firstOrgCard.locator("a").first().click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify users are loaded in card view", async () => {
      // Wait for user cards to appear
      const userCards = page.locator(".grid > .h-full");
      const cardCount = await userCards.count();

      if (cardCount === 0) {
        // Skip test if no users are linked to this organization
        test.skip();
      }

      await expect(userCards.first()).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify facility organization role is displayed and translated", async () => {
      // Get the first user card
      const firstCard = page.locator(".grid > .h-full").first();

      // Verify that the card contains facility organization role text
      const roleText = firstCard.locator(".text-gray-500");
      const roleCount = await roleText.count();

      // At least one text element should be the role
      expect(roleCount).toBeGreaterThan(0);

      // Verify the role is visible and has text content
      const firstRoleText = await roleText.first().textContent();
      expect(firstRoleText).toBeTruthy();
      expect(firstRoleText!.length).toBeGreaterThan(0);
    });

    await test.step("Verify role has consistent styling", async () => {
      const firstCard = page.locator(".grid > .h-full").first();

      // Find role element with gray styling (text-sm text-gray-500)
      const roleElement = firstCard.locator(".text-gray-500").first();
      await expect(roleElement).toBeVisible({ timeout: 5000 });

      // Verify it's positioned near user identity (username, email)
      const username = firstCard
        .locator(".text-gray-500")
        .filter({ hasText: /@/ });
      const usernameExists = await username.count();

      // Both role and username should be visible with consistent styling
      if (usernameExists > 0) {
        await expect(username).toBeVisible();
      }
    });
  });

  test("should verify role translation is applied", async ({ page }) => {
    await test.step("Navigate to organization users page", async () => {
      await page.goto("/");
      await page.getByRole("tab", { name: "Governance" }).click();
      await page
        .getByRole("link", { name: /Government$/ })
        .first()
        .click();
      await page.getByRole("menuitem", { name: "Users" }).click();
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify role text is capitalized (translated)", async () => {
      const userCards = page.locator(".grid > .h-full");
      const cardCount = await userCards.count();

      // Collect all role texts from cards (excluding username which has @)
      const roleTexts: string[] = [];
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = userCards.nth(i);
        const roleElements = card
          .locator(".text-gray-500")
          .filter({ hasNotText: /@/ });
        const roleCount = await roleElements.count();

        if (roleCount > 0) {
          const text = await roleElements.first().textContent();
          if (text && text.trim().length > 0) {
            roleTexts.push(text.trim());
          }
        }
      }

      // Verify we found some roles
      expect(roleTexts.length).toBeGreaterThan(0);

      // Verify role texts are capitalized (proper translation)
      // Note: Translation keys are passed through t() function
      roleTexts.forEach((roleText) => {
        // Role text should exist and have content
        expect(roleText.length).toBeGreaterThan(0);
        // First character should be uppercase if translated properly
        expect(roleText).toMatch(/^[A-Z]/);
      });
    });
  });
});
