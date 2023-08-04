// @ts-check
import { WebSocketServer } from 'ws';
import { test, expect } from '@playwright/test';

test.describe('E2E', () => {
  let page = null;
  let socketServer = null;

  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Define mocking WebSocket server
    socketServer = new WebSocketServer({ port: 3001 });
    socketServer.on('connection', (ws) => {
      ws.send(JSON.stringify({ users: socketServer.clients.size }));
    });
  });

  test.afterAll(async () => {
    await page.close();
    socketServer.close();
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

      const wsLogic = async (ws) => {
        console.log('WebSocket initiated');
        ws.on('framereceived', async (event) => {
          const payload = JSON.parse(event.payload.toString());
          console.log(`${page} got from a server:`, payload);
        });
        ws.on('close', () => console.log('WebSocket closed'));
      };

      page.on('websocket', wsLogic);

      const buttonResolver = async (selector) => {
        const element = await page.locator(selector);
        const isVisible = await element.isVisible();
        if (isVisible) {
          return element;
        }
        throw Error('Not visible!');
      };

      const buttonPromiseArray = await Promise.allSettled([buttonResolver('button.menu-button'), buttonResolver('button.navbar-burger')]);
      const menuButton = buttonPromiseArray.find((promise) => promise.status === 'fulfilled').value;
      menuButton.click();

      const textButton = await page.locator('button.text-button');
      textButton.click();

      const cancelButton = await page.locator('button.cancel');
      await expect(cancelButton).toBeEnabled();

      const saveButton = await page.locator('button.save');
      await expect(saveButton).toBeDisabled();

      const textarea = await page.locator('textarea.textarea');
      await textarea.type(textNoteDescription);
      await expect(saveButton).toBeDisabled();

      const input = await page.locator('input.input');
      await input.type(textNoteName);
      await expect(saveButton).toBeEnabled();

      saveButton.click();

      const item = await page.locator('.notes-list-item', { hasText: textNoteName });
      await expect(item).toContainText(textNoteDescription);
    });

    test('Delete a text note', async () => {
      await page.route('http://localhost:3001/chest-of-notes/mongo/delete/kwl3kjsb3', (route) => route.fulfill({
        status: 200,
        body: JSON.stringify({
          status: 'Deleted',
          data: 'kwl3kjsb3',
        }),
      }));

      page.on('dialog', (prompt) => prompt.accept());

      const item = await page.locator('.notes-list-item', { hasText: initNoteName });
      const deleteButton = await item.locator('.delete-note');
      await deleteButton.click();
      await expect(item).toHaveCount(0);
    });
  });
});
