/* eslint-disable no-param-reassign */
import Modal from './modal';
import Preview from './preview';
import { animateOpening } from './utils';

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

    const previewListener = (dataType, dataContent) => {
      const previewWrapper = this.page.querySelector('.preview');
      const preview = new Preview(previewWrapper, dataType, dataContent);
      animateOpening(previewWrapper, this.background);
    };

    /**
     * A listener to open the content modal
     */
    const contentButtons = [this.audioButton, this.videoButton, this.textButton];
    contentButtons.forEach((button) => {
      // Make a listener for each button
      const listener = (event) => {
        event.preventDefault();
        // Resolve a modal view according to a clicked button
        const { modalAdd, type } = this.modal.openModal(button, contentButtons, previewListener);
        animateOpening(modalAdd, this.background);
        if (type !== 'text') {
          this.modal.addModalButtonListeners();
        }
      };
      button.addEventListener('click', listener);
    });
  }
}
