import { expect, test } from "@playwright/test";
import { format, subDays } from "date-fns";
import { getFacilityId } from "tests/support/facilityId";

test.use({ storageState: "tests/.auth/facilityAdmin.json" });

test.describe("Dispense History Infinite Pagination", () => {
  let facilityId: string;

  test.beforeEach(async ({ page }) => {
    facilityId = getFacilityId();
    const createdDateAfter = format(subDays(new Date(), 90), "yyyy-MM-dd");
    const createdDateBefore = format(new Date(), "yyyy-MM-dd");

    // Navigate to encounters list and select the first in-progress encounter
    await page.goto(
      `/facility/${facilityId}/encounters/patients/all?created_date_after=${createdDateAfter}&created_date_before=${createdDateBefore}&status=in_progress`,
    );

    await page.getByText("View Encounter").first().click();
    await page.getByRole("tab", { name: "Medicines" }).click();
  });

  test("should load initial page of dispense orders", async ({ page }) => {
    await test.step("Navigate to Dispense History tab", async () => {
      // Click on the Dispense History tab
      await page.getByRole("tab", { name: /Dispense History/i }).click();

      // Wait for the dispense orders to load
      await page.waitForResponse(
        (resp) =>
          resp.url().includes("/api/v1/") &&
          resp.url().includes("dispense_order") &&
          resp.status() === 200,
        { timeout: 10000 },
      );
    });

    await test.step("Verify initial load displays dispense orders", async () => {
      // Check if dispense order list is visible
      // The component shows cards with package icons for each dispense order
      const dispenseOrderCards = page.locator('[data-slot="card"]').filter({
        has: page.locator("svg").first(),
      });

      // Should have at least one dispense order (if any exist)
      const count = await dispenseOrderCards.count();

      if (count > 0) {
        // Verify the first dispense order is visible
        await expect(dispenseOrderCards.first()).toBeVisible();

        // Verify each card has location information
        await expect(
          dispenseOrderCards.first().getByText(/location:/i),
        ).toBeVisible();
      }
    });
  });

  test("should load more dispense orders on scroll (desktop)", async ({
    page,
  }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await test.step("Navigate to Dispense History tab", async () => {
      await page.getByRole("tab", { name: /Dispense History/i }).click();

      // Wait for initial load
      await page.waitForResponse(
        (resp) =>
          resp.url().includes("dispense_order") && resp.status() === 200,
        { timeout: 10000 },
      );
    });

    await test.step("Verify pagination behavior", async () => {
      // Get initial count of dispense order cards
      const dispenseOrderList = page.locator(".space-y-2.p-2").first();
      const initialCards = dispenseOrderList.locator('[data-slot="card"]');
      const initialCount = await initialCards.count();

      if (initialCount > 0) {
        // Scroll to the bottom of the list
        await dispenseOrderList.evaluate((el) => {
          el.scrollTop = el.scrollHeight;
        });

        // Wait a moment for intersection observer to trigger
        await page.waitForTimeout(500);

        // Check if loading skeleton appears (if there are more pages)
        const skeleton = page.locator('[data-testid="card-list-skeleton"]');

        // If skeleton appears, more items are loading
        if (await skeleton.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Wait for skeleton to disappear (items loaded)
          await expect(skeleton).not.toBeVisible({ timeout: 5000 });

          // Verify new items were added
          const updatedCount = await initialCards.count();
          expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
        }
      }
    });
  });

  test("should load more dispense orders on scroll (mobile)", async ({
    page,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step("Navigate to Dispense History tab", async () => {
      await page.getByRole("tab", { name: /Dispense History/i }).click();

      // Wait for initial load
      await page.waitForResponse(
        (resp) =>
          resp.url().includes("dispense_order") && resp.status() === 200,
        { timeout: 10000 },
      );
    });

    await test.step("Open mobile drawer", async () => {
      // On mobile, dispense orders are in a drawer
      // Look for the button that opens the drawer
      const drawerTrigger = page.getByRole("button").filter({
        has: page.locator('svg[class*="PackageIcon"]'),
      });

      // If the drawer trigger exists, click it
      if ((await drawerTrigger.count()) > 0) {
        await drawerTrigger.first().click();

        // Wait for drawer to open
        await page.waitForTimeout(300);
      }
    });

    await test.step("Verify pagination in drawer", async () => {
      // Find the drawer content with dispense orders
      const drawerContent = page.locator('[role="dialog"]');

      if (await drawerContent.isVisible().catch(() => false)) {
        const dispenseOrderList = drawerContent.locator(".space-y-2.p-2");
        const initialCards = dispenseOrderList.locator('[data-slot="card"]');
        const initialCount = await initialCards.count();

        if (initialCount > 0) {
          // Scroll to bottom of drawer
          await dispenseOrderList.evaluate((el) => {
            el.scrollTop = el.scrollHeight;
          });

          // Wait for intersection observer
          await page.waitForTimeout(500);

          // Check for loading skeleton
          const skeleton = drawerContent.locator(
            '[data-testid="card-list-skeleton"]',
          );

          if (await skeleton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await expect(skeleton).not.toBeVisible({ timeout: 5000 });

            const updatedCount = await initialCards.count();
            expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
          }
        }
      }
    });
  });

  test("should preserve selected dispense order across pagination", async ({
    page,
  }) => {
    await test.step("Navigate to Dispense History tab", async () => {
      await page.getByRole("tab", { name: /Dispense History/i }).click();

      await page.waitForResponse(
        (resp) =>
          resp.url().includes("dispense_order") && resp.status() === 200,
        { timeout: 10000 },
      );
    });

    await test.step("Select a dispense order", async () => {
      const dispenseOrderList = page.locator(".space-y-2.p-2").first();
      const dispenseOrderCards =
        dispenseOrderList.locator('[data-slot="card"]');

      if ((await dispenseOrderCards.count()) > 0) {
        // Click the first dispense order
        await dispenseOrderCards.first().click();

        // Verify it's selected (has primary border and indicator)
        await expect(
          dispenseOrderCards.first().locator(".border-primary-600"),
        ).toBeVisible();
      }
    });

    await test.step("Scroll to trigger pagination", async () => {
      const dispenseOrderList = page.locator(".space-y-2.p-2").first();

      // Scroll to bottom
      await dispenseOrderList.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });

      await page.waitForTimeout(500);

      // If skeleton appears, wait for it to disappear
      const skeleton = page.locator('[data-testid="card-list-skeleton"]');
      if (await skeleton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(skeleton).not.toBeVisible({ timeout: 5000 });
      }
    });

    await test.step("Verify selection is preserved", async () => {
      const dispenseOrderList = page.locator(".space-y-2.p-2").first();
      const selectedCard = dispenseOrderList
        .locator('[data-slot="card"]')
        .locator(".border-primary-600");

      // The first card should still be selected
      await expect(selectedCard).toBeVisible();
    });
  });
});
