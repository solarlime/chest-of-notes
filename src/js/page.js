export default class Page {
  constructor() {
    this.page = document.body;
    this.notes = this.page.querySelector('.notes');
    this.footerLogo = this.page.querySelector('.footer-logo');
    this.about = this.page.querySelector('.about');

    this.notes.scrollIntoView();
  }

  addEventListeners() {
    /**
         * A function for showing an 'about' modal;
         */
    this.footerLogo.addEventListener('click', () => this.about.classList.add('active'));

    /**
         * A listener for hiding an 'about' modal after the animation end;
         */
    this.about.addEventListener('animationend', () => this.about.classList.remove('active'));
  }
}
