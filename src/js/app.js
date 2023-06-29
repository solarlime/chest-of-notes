import Page from './page';

export default class App {
  static async init() {
    // /**
    //  * A listener for resizing. Works good for mobiles
    //  */
    // window.addEventListener('resize', () => {
    //   const vh = window.innerHeight * 0.01;
    //   document.documentElement.style.setProperty('--vh', `${vh}px`);
    // });
    // window.dispatchEvent(new Event('resize'));

    // It's necessary to recognise if the page is loaded locally or not to choose a server location
    const serverHost = process.env.SERVERHOST ? process.env.SERVERHOST : 'http://localhost:3001';

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
      const page = new Page(serverHost, result.data);
      // page.addEventListeners();

      console.log('Initiated!');
    } catch (e) {
      alert(`An error occurred: ${e.message} The page will be reloaded.`);
      window.location.reload();
    }
  }
}
