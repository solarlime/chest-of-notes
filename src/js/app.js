export default class App {
  static init() {
    /**
     * A listener for resizing. Works good for mobiles
     */
    window.addEventListener('resize', () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    });
    window.dispatchEvent(new Event('resize'));

    const main = document.querySelector('.main');
    main.scrollIntoView();

    console.log('init');
  }
}
