/* eslint-disable no-param-reassign */
import Modal from './modal';

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
    this.background = this.page.querySelectorAll('section, footer');

    this.modal = new Modal(this.page);
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
    this.addButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.add.scrollIntoView({ behavior: 'smooth' });
    });

    /**
     * A listener for a 'back' button
     */
    this.backButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.notes.scrollIntoView({ behavior: 'smooth' });
    });

    /**
     * A listener to open the content modal
     */
    const contentButtons = [this.audioButton, this.videoButton, this.textButton];
    contentButtons.forEach((button) => {
      // Make a listener for each button
      const listener = (event) => {
        event.preventDefault();
        // Resolve a modal view according to a clicked button
        const modalAdd = this.modal.openModal(button, contentButtons);
        const notNew = Array.from(this.background).find((item) => item.classList.contains('remove-blur'));
        if (notNew) {
          this.background.forEach((item) => item.classList.toggle('blur'));
          this.background.forEach((item) => item.classList.toggle('remove-blur'));
          modalAdd.classList.toggle('modal-active');
          modalAdd.classList.toggle('modal-inactive');
        } else {
          this.background.forEach((item) => item.classList.add('blur'));
          modalAdd.classList.add('modal-active');
        }
        this.modal.addModalButtonListeners();
      };
      button.addEventListener('click', listener);
    });
  }
}
