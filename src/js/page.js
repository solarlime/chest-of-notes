export default class Page {
  constructor() {
    this.page = document.body;
    this.add = this.page.querySelector('.add');
    this.notes = this.page.querySelector('.notes');
    this.addButton = this.page.querySelector('button.notes-go-to-add-button');
    this.backButton = this.page.querySelector('button.back-button');
    this.audioButton = this.page.querySelector('button.audio-button');
    this.videoButton = this.page.querySelector('button.video-button');
    this.textButton = this.page.querySelector('button.text-button');
    this.modalAdd = this.page.querySelector('.modal-add');
    this.modalCloseButton = this.page.querySelector('button.close');
    this.footerLogo = this.page.querySelector('.footer-logo');
    this.about = this.page.querySelector('.about');

    this.notes.scrollIntoView();
  }

  addEventListeners() {
    /**
     * A listener for showing an 'about' modal
     */
    this.footerLogo.addEventListener('click', () => this.about.classList.add('active'));

    /**
     * A listener for hiding an 'about' modal after the animation end
     */
    this.about.addEventListener('animationend', () => this.about.classList.remove('active'));

    /**
     * A listener for an 'add' button
     */
    this.addButton.addEventListener('click', () => this.add.scrollIntoView({ behavior: 'smooth' }));

    /**
     * A listener for a 'back' button
     */
    this.backButton.addEventListener('click', () => this.notes.scrollIntoView({ behavior: 'smooth' }));

    /**
     * Listeners to open the content modal
     */
    [this.audioButton, this.videoButton, this.textButton].forEach((button) => button.addEventListener('click', (event) => {
      console.log(event);
      this.page.querySelectorAll('section, footer').forEach((item) => item.classList.add('blur'));
      this.modalAdd.classList.add('modal-active');
    }));

    this.modalCloseButton.addEventListener();

  }
}
