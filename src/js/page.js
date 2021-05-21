/* eslint-disable no-param-reassign */

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
    this.modalAdd = this.page.querySelector('.modal-add');
    this.modalTextForm = this.page.querySelector('.modal-add-form-text');
    this.modalFormDescriptionMedia = this.page.querySelector('.modal-add-form-description-media');
    this.modalStartButton = this.page.querySelector('button.start');
    this.modalStopButton = this.page.querySelector('button.stop');
    this.modalSaveButton = this.page.querySelector('button.save');
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
     * Listeners to open the content modal
     */
    [this.audioButton, this.videoButton, this.textButton].forEach((button) => button.addEventListener('click', (event) => {
      event.preventDefault();

      switch (button) {
        case this.audioButton: {
          this.modalTextForm.classList.add('hidden');
          break;
        }
        case this.videoButton: {
          this.modalTextForm.classList.add('hidden');
          break;
        }
        case this.textButton: {
          [this.modalStartButton, this.modalStopButton, this.modalFormDescriptionMedia].forEach((item) => item.classList.add('hidden'));
          break;
        }
        default: {
          console.log('Hmm, something else happened!');
        }
      }

      const notNew = Array.from(this.background).find((item) => item.classList.contains('remove-blur'));
      if (notNew) {
        this.background.forEach((item) => item.classList.toggle('blur'));
        this.background.forEach((item) => item.classList.toggle('remove-blur'));
        this.modalAdd.classList.toggle('modal-active');
        this.modalAdd.classList.toggle('modal-inactive');
      } else {
        this.background.forEach((item) => item.classList.add('blur'));
        this.modalAdd.classList.add('modal-active');
      }
    }));

    // this.modalSaveButton.addEventListener('click', (event) => {
    //   event.preventDefault();
    //   console.log('wow');
    //   fetch('/api/server/mongo', {
    //     cache: 'no-cache',
    //   }).then((result) => console.log(result));
    // });

    this.modalSaveButton.addEventListener('click', async (event) => {
      event.preventDefault();
      await fetch('/api/server/mongo', {
        cache: 'no-cache',
      });
    });


    /**
     * Listeners to close the content modal
     */
    this.modalCloseButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.background.forEach((item) => item.classList.toggle('blur'));
      this.background.forEach((item) => item.classList.toggle('remove-blur'));
      this.modalAdd.classList.toggle('modal-active');
      this.modalAdd.classList.toggle('modal-inactive');
      setTimeout(() => {
        // eslint-disable-next-line max-len
        [this.modalTextForm, this.modalStartButton, this.modalStopButton, this.modalFormDescriptionMedia]
          .forEach((item) => (item.classList.contains('hidden') ? item.classList.remove('hidden') : null));
      }, 1000);
    });
  }
}
