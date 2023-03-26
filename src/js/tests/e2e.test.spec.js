// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('E2E', () => {
  let page = null;

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.describe('A set of tests', () => {
    const initNoteName = 'Lorem ipsum';
    const initNoteDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris augue lacus, ullamcorper eget finibus quis, porttitor non ligula.';
    const textNoteName = 'Sample note';
    const textNoteDescription = 'Sample note description';

    test('Create a text note', async () => {
      await page.route('http://localhost:3001/chest-of-notes/mongo/fetch/all', (route) => route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'Fetched',
          data: [{
            id: 'kwl3kjsb3', name: initNoteName, type: 'text', content: initNoteDescription,
          }],
        }),
      }));
      await page.route('http://localhost:3001/chest-of-notes/mongo/add', (route) => route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'Added',
          data: 'aqrv2jel1',
        }),
      }));

      await page.goto('/', { waitUntil: 'networkidle' });

      const notesList = await page.locator('.notes-list');
      const textButton = await page.locator('.text-button');
      const nameInput = await page.locator('#modal-add-form-input');
      const descriptionInput = await page.locator('#modal-add-form-text-area');
      const saveButton = await page.locator('.save');

      await textButton.click();

      await nameInput.fill(textNoteName);
      await descriptionInput.fill(textNoteDescription);
      await saveButton.click();

      const item = await notesList.locator('.notes-list-item', { hasText: textNoteName });
      await item.locator('.spoiler').click();
      const description = await item.locator('.notes-list-item-description');

      await expect(description).toHaveText(textNoteDescription);
    });

    test('Delete a text note', async () => {
      await page.route('http://localhost:3001/chest-of-notes/mongo/delete/kwl3kjsb3', (route) => route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'Deleted',
          data: 'kwl3kjsb3',
        }),
      }));

      const notesList = await page.locator('.notes-list');

      const item = await notesList.locator('.notes-list-item', { hasText: initNoteName });
      const deleteButton = await item.locator('.delete-note');
      await deleteButton.click();
      await expect(item).toHaveCount(0);
    });
  });
});
