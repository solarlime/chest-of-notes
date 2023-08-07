import { createStore } from 'zustand/vanilla';
import Page from './page';

export default class App {
  static async init() {
    // It's necessary to recognise if the page is loaded locally or not to choose a server location
    const serverHost = process.env.SERVERHOST ? process.env.SERVERHOST : 'http://localhost:3001';

    const store = createStore(() => ({
      form: 0,
      opened: null,
    }));

    // Some notes may have been uploaded yet. Fetch them!
    try {
      const res = await fetch(`${serverHost}/chest-of-notes/mongo/fetch/all`, {
        method: 'GET',
      });
      const result = await res.json();
      console.log(result);
      if (result.status.includes('Error')) {
        throw Error(result.data);
      }
      store.setState((previous) => ({ ...previous, items: result.data }));
      const page = new Page(serverHost, store);
      await page.init();

      console.log('Initiated!');
    } catch (e) {
      alert(`An error occurred: ${e.message} The page will be reloaded.`);
      window.location.reload();
    }
  }
}
