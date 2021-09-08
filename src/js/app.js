import Page from './page';

export default class App {
  static async init() {
    /**
     * A listener for resizing. Works good for mobiles
     */
    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
    window.dispatchEvent(new Event('resize'));

    try {
      const res = await fetch('http://localhost:3001/chest-of-notes/mongo/fetch/all', {
        method: 'GET',
      });
      const result = await res.json();
      console.log(result);
      const page = new Page(result.data);
      page.addEventListeners();

      console.log('Initiated!');
    } catch (e) {
      alert(`An error occurred: ${e.message} The page will be reloaded.`);
      window.location.reload();
    }
  }
}
