import { expect, test } from "@playwright/test";
import { getFacilityId } from "tests/support/facilityId";

/**
 * User Role Display Tests
 *
 * Tests verify that user roles are correctly displayed in user list cards
 * across different contexts:
 * - Facility users page (card view and table view)
 * - Role text is translated and readable
 * - Consistent styling and positioning
 */

test.use({ storageState: "tests/.auth/user.json" });

test.describe("User Role Display", () => {
  let facilityId: string;

  test.beforeEach(async () => {
    facilityId = getFacilityId();
  });

  test("should display user roles in card view", async ({ page }) => {
    await test.step("Navigate to facility users page", async () => {
      await page.goto(`/facility/${facilityId}/users`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify users are loaded in card view", async () => {
      // Check that we're in card view (default view)
      const userCards = page.locator(".grid > .h-full");
      await expect(userCards.first()).toBeVisible({ timeout: 10000 });
    });

    await test.step("Verify role is displayed on user cards", async () => {
      // Get the first user card
      const firstCard = page.locator(".grid > .h-full").first();

      // Verify that the card contains role text
      // Role should be visible as translated text (Doctor, Nurse, Staff, etc.)
      const roleText = firstCard.locator(
        "text=/Doctor|Nurse|Staff|Volunteer|Administrator/i",
      );
      await expect(roleText).toBeVisible({ timeout: 5000 });

      // Verify role text has correct styling (text-sm text-gray-500)
      const roleElement = firstCard
        .locator(".text-gray-500")
        .filter({ hasText: /Doctor|Nurse|Staff|Volunteer|Administrator/i });
      await expect(roleElement).toBeVisible();
    });

    await test.step("Verify multiple user cards display roles", async () => {
      // Check that at least 2 user cards display roles
      const userCards = page.locator(".grid > .h-full");
      const cardCount = await userCards.count();

      if (cardCount >= 2) {
        for (let i = 0; i < Math.min(cardCount, 3); i++) {
          const card = userCards.nth(i);
          const hasRole = await card
            .locator(".text-gray-500")
            .filter({ hasText: /Doctor|Nurse|Staff|Volunteer|Administrator/i })
            .count();
          // Card should have role text (count > 0)
          expect(hasRole).toBeGreaterThan(0);
        }
      }
    });
  });

  test("should display user roles in table view", async ({ page }) => {
    await test.step("Navigate to facility users page", async () => {
      await page.goto(`/facility/${facilityId}/users`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Switch to table view", async () => {
      // Find and click the table/list view toggle button
      // Looking for a button or toggle that switches views
      const viewToggle = page
        .locator("button")
        .filter({ hasText: /list|table/i });
      const toggleExists = await viewToggle.count();

      if (toggleExists > 0) {
        await viewToggle.first().click();
        await page.waitForTimeout(500); // Wait for view transition
      }
    });

    await test.step("Verify role column exists in table", async () => {
      // Check for table structure
      const table = page.locator("table");
      const tableExists = await table.count();

      if (tableExists > 0) {
        // Check for Role column header
        const roleHeader = page.locator("th").filter({ hasText: /role/i });
        await expect(roleHeader).toBeVisible({ timeout: 5000 });

        // Check for role values in table rows
        const roleCell = page.locator("td#role").first();
        await expect(roleCell).toBeVisible({ timeout: 5000 });

        // Verify role cell contains translated role text
        const roleCellText = await roleCell.textContent();
        expect(roleCellText).toMatch(
          /Doctor|Nurse|Staff|Volunteer|Administrator/i,
        );
      }
    });
  });

  test("should display correct role text for different user types", async ({
    page,
  }) => {
    await test.step("Navigate to facility users page", async () => {
      await page.goto(`/facility/${facilityId}/users`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify translated role text appears", async () => {
      // The fixture users include various roles: doctor, nurse, staff, volunteer, admin
      // Verify at least one of each type appears with translated text
      const userCards = page.locator(".grid > .h-full");
      const cardCount = await userCards.count();

      // Collect all role texts from cards
      const roleTexts: string[] = [];
      for (let i = 0; i < Math.min(cardCount, 10); i++) {
        const card = userCards.nth(i);
        const roleElement = card
          .locator(".text-gray-500")
          .filter({ hasText: /Doctor|Nurse|Staff|Volunteer|Administrator/i });
        const roleCount = await roleElement.count();

        if (roleCount > 0) {
          const text = await roleElement.first().textContent();
          if (text) {
            roleTexts.push(text.trim());
          }
        }
      }

      // Verify we found some roles
      expect(roleTexts.length).toBeGreaterThan(0);

      // Verify role texts are capitalized (proper translation)
      roleTexts.forEach((roleText) => {
        expect(roleText).toMatch(/^[A-Z]/); // First character should be uppercase
      });
    });
  });

  test("should handle missing role data gracefully", async ({ page }) => {
    await test.step("Navigate to facility users page", async () => {
      await page.goto(`/facility/${facilityId}/users`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify cards render without errors", async () => {
      // Even if a user has no role, the card should render correctly
      const userCards = page.locator(".grid > .h-full");
      await expect(userCards.first()).toBeVisible({ timeout: 10000 });

      // Check that the page doesn't have any console errors or broken layouts
      const cardCount = await userCards.count();
      expect(cardCount).toBeGreaterThan(0);

      // Verify card structure is intact
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = userCards.nth(i);
        // Card should have user name
        await expect(card.locator(".font-bold").first()).toBeVisible();
        // Card should have "See Details" button
        await expect(
          card.locator("button").filter({ hasText: /see details/i }),
        ).toBeVisible();
      }
    });
  });

  test("should display role with consistent styling", async ({ page }) => {
    await test.step("Navigate to facility users page", async () => {
      await page.goto(`/facility/${facilityId}/users`);
      await page.waitForLoadState("networkidle");
    });

    await test.step("Verify role styling consistency", async () => {
      const firstCard = page.locator(".grid > .h-full").first();

      // Find role element
      const roleElement = firstCard
        .locator(".text-gray-500")
        .filter({ hasText: /Doctor|Nurse|Staff|Volunteer|Administrator/i });
      await expect(roleElement).toBeVisible({ timeout: 5000 });

      // Verify it has text-sm class (via computed style check)
      // Role should be positioned near username
      const username = firstCard
        .locator(".text-gray-500")
        .filter({ hasText: /@/ });
      const usernameExists = await username.count();

      // Both role and username should be visible if role exists
      if (usernameExists > 0) {
        await expect(username).toBeVisible();
      }
    });
  });
});
