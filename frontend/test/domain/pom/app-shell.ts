import { expect } from '@playwright/test';
import { BasePage } from './base-page';

/** Main menu / entry-point navigation. */
export class AppShell extends BasePage {
  protected readonly route = '/dashboard';
  protected readonly loadingNoun = 'dashboard';

  /** Opens the application with no explicit destination. */
  async openApplicationRoot(): Promise<void> {
    await this.load('/');
    await this.settle();
  }

  /**
   * Opens a destination the application does not know about.
   *
   * With path routing this is a real URL the dev/preview server must fall back
   * on, which the React Router catch-all route then redirects to /dashboard.
   */
  async openUnknownLocation(): Promise<void> {
    await this.load('/this-route-does-not-exist');
    await this.settle();
  }

  async followMainMenuItem(label: string): Promise<void> {
    await this.page
      .locator('.navbar-nav a', { hasText: new RegExp(`^${label}$`) })
      .click();
    await this.settle();
  }

  /** Heading of whatever section is currently displayed. */
  async currentSectionHeading(): Promise<string> {
    const heading = this.page.locator('[ng-view] h2').first();
    await expect(heading).toBeVisible();
    return (await heading.innerText()).trim();
  }

  /** Whether the browser location now identifies the dashboard. */
  async isLocatedOnDashboard(): Promise<boolean> {
    return new URL(this.page.url()).pathname === '/dashboard';
  }
}
