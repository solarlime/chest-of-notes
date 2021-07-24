/* eslint-disable no-param-reassign */
import uniqid from 'uniqid';
import { formatTime, addMediaElement, renderNewNote } from './utils';

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
    this.modalAddForm = this.page.querySelector('.modal-add-form');
    this.modalAddFormHeader = this.page.querySelector('.modal-add-form-header');
    this.modalFormName = this.modalAdd.querySelector('#modal-add-form-input');
    this.modalFormTextArea = this.modalAdd.querySelector('#modal-add-form-text-area');
    this.modalFormText = this.page.querySelector('.modal-add-form-text');
    this.modalFormDescriptionBoth = this.page.querySelector('.modal-add-form-description-both');
    this.modalFormDescriptionMedia = this.page.querySelector('.modal-add-form-description-media');
    this.modalFormMedia = this.page.querySelector('.modal-add-form-media');
    this.modalStartButton = this.page.querySelector('button.start');
    this.modalStopButton = this.page.querySelector('button.stop');
    this.modalSaveButton = this.page.querySelector('button.save');
    this.modalCloseButton = this.page.querySelector('button.close');

    this.player = this.modalAdd.querySelector('.modal-player');
    this.play = this.modalAdd.querySelector('button.modal-player-play');
    this.pause = this.modalAdd.querySelector('button.modal-player-pause');
    this.back = this.modalAdd.querySelector('button.modal-player-back');
    this.forward = this.modalAdd.querySelector('button.modal-player-forward');
    this.time = this.modalAdd.querySelector('.modal-player-time');
    this.duration = this.modalAdd.querySelector('.modal-player-duration');

    this.notesList = this.page.querySelector('.notes-list');
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
          [
            this.modalAddFormHeader,
            this.modalFormName,
            this.modalFormMedia,
            this.modalFormDescriptionMedia,
            this.modalFormDescriptionBoth,
          ].forEach((item) => item.classList.remove('hidden'));
          this.type = 'audio';
          this.media = addMediaElement(this.type, this.player);
          break;
        }
        case this.videoButton: {
          [
            this.modalAddFormHeader,
            this.modalFormName,
            this.modalFormMedia,
            this.modalFormDescriptionMedia,
            this.modalFormDescriptionBoth,
          ].forEach((item) => item.classList.remove('hidden'));
          this.type = 'video';
          this.media = addMediaElement(this.type, this.player);
          break;
        }
        case this.textButton: {
          [
            this.modalAddFormHeader,
            this.modalFormName,
            this.modalFormText,
            this.modalFormMedia,
            this.modalFormDescriptionBoth,
          ].forEach((item) => item.classList.remove('hidden'));
          [this.modalStartButton, this.modalStopButton].forEach((item) => item.classList.add('hidden'));
          this.type = 'text';
          break;
        }
        default: {
          console.log('Hmm, something else happened!');
        }
      }

      if (!event.isTrusted) {
        for (const item of this.modalAddForm.children) {
          if ((item.id === 'media') || (item.classList.contains('modal-player'))) {
            item.classList.remove('hidden');
          } else {
            item.classList.add('hidden');
          }
        }
        this.player.style.order = '1';
        this.media.src = this.dataContent;
        this.addMediaElementListeners();

        const listener = (evt) => {
          if (evt.target === this.modalAdd) {
            this.pause.dispatchEvent(new Event('click'));
            this.modalCloseButton.dispatchEvent(new Event('click'));
            this.player.style.order = '';
            this.modalAdd.removeEventListener('click', listener);
          }
        };

        this.modalAdd.addEventListener('click', listener);
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

    this.modalSaveButton.addEventListener('click', async (event) => {
      event.preventDefault();
      const id = uniqid();
      const data = {
        id,
        name: this.modalFormName.value,
        type: this.type,
      };

      const send = async () => {
        console.log(data);
        // const res = await fetch('http://localhost:3001/chest-of-notes/mongo/update', {
        //   method: 'POST',
        //   body: JSON.stringify(data),
        // });
        // const result = await res.json();
        // console.log(result);
      };

      const fileSend = async (callback) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(new File([this.pipeBlob], `${id}.mp4`));

        await new Promise((resolve) => {
          fileReader.addEventListener('loadend', async () => {
            data.content = fileReader.result;
            await callback();
            resolve();
          });
        });
      };

      if (data.type === 'text') {
        data.content = this.modalFormTextArea.value;
        await send();
      } else {
        await fileSend(send);
      }

      this.modalCloseButton.dispatchEvent(new Event('click'));
      const { notesListItem, isText } = renderNewNote(this.notesList, data);

      if (!isText) {
        const mediaContent = notesListItem.querySelector('.notes-list-item-description');
        mediaContent.parentElement.setAttribute('data-content', data.content);
        mediaContent.addEventListener('click', () => {
          this.dataContent = mediaContent.parentElement.getAttribute('data-content');
          this[`${data.type}Button`].dispatchEvent(new Event('click'));
        });
      }
    });

    this.modalStartButton.addEventListener('click', async () => {
      if (!navigator.mediaDevices) {
        return;
      }
      try {
        const tag = this.media.tagName.toLowerCase();
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: (tag === 'video') });
        this.mediaRecorder = new MediaRecorder(this.stream, { type: `${tag}/mp4` });
        const pipeline = [];
        this.mediaRecorder.start();
        this.modalStartButton.classList.add('hidden');
        this.modalStopButton.classList.remove('hidden');
        if (tag === 'video') {
          this.media.srcObject = this.stream;
          this.media.play();
        }

        this.mediaRecorder.addEventListener('dataavailable', (event) => {
          pipeline.push(event.data);
          if (this.mediaRecorder.state === 'inactive') {
            this.pipeBlob = new Blob(pipeline, { type: 'audio/mp4' });
            this.media.src = URL.createObjectURL(this.pipeBlob);
            this.media.srcObject = null;
          }
        });
      } catch (e) {
        console.log(e);
      }
    });

    this.modalStopButton.addEventListener('click', () => {
      this.mediaRecorder.stop();
      this.addMediaElementListeners();
      this.modalStopButton.classList.add('hidden');
    });

    this.play.addEventListener('click', () => {
      this.media.play();
      this.play.classList.add('hidden');
      this.pause.classList.remove('hidden');
    });

    this.pause.addEventListener('click', () => {
      this.media.pause();
      this.pause.classList.add('hidden');
      this.play.classList.remove('hidden');
    });

    this.back.addEventListener('click', () => {
      if (this.media.currentTime > 5) {
        this.media.currentTime -= 5;
      } else {
        this.media.currentTime = 0;
      }
    });

    this.forward.addEventListener('click', () => {
      if (this.media.currentTime < this.media.duration - 5) {
        this.media.currentTime += 5;
      } else {
        this.media.currentTime = this.media.duration;
        this.pause.classList.add('hidden');
        this.play.classList.remove('hidden');
      }
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
      if (this.media) {
        this.media = null;
        this.time.textContent = '00:00';
        this.duration.textContent = '00:00';
        this.player.classList.add('hidden');
      }
      if (!event.isTrusted) {
        [this.modalFormName, this.modalFormTextArea].forEach((item) => { item.value = ''; });
      }
      setTimeout(() => {
        // eslint-disable-next-line max-len
        [this.modalFormText, this.modalStartButton, this.modalFormDescriptionMedia]
          .forEach((item) => (item.classList.contains('hidden') ? item.classList.remove('hidden') : null));
        for (const item of this.modalAddForm.children) {
          item.classList.add('hidden');
        }
      }, 500);
    });
  }

  addMediaElementListeners() {
    this.media.addEventListener('canplay', () => {
      // A bugfix for Chromium: it can't get the duration
      if (this.media.duration === Infinity) {
        const listener = () => {
          this.media.currentTime = 0;
          this.media.removeEventListener('timeupdate', listener);
        };

        this.media.addEventListener('timeupdate', listener);
        this.media.currentTime = 1e101;
      }
      this.duration.textContent = formatTime(parseInt(this.media.duration, 10));
      if (this.player.classList.contains('hidden')) {
        this.player.classList.remove('hidden');
      }
    });

    this.media.addEventListener('timeupdate', () => {
      if (this.duration.textContent !== '00:00') {
        const time = formatTime(parseInt(this.media.currentTime, 10));
        if (this.time.textContent !== `${time} `) this.time.textContent = `${time} `;
      }
    });

    this.media.addEventListener('ended', () => {
      this.pause.classList.add('hidden');
      this.play.classList.remove('hidden');
    });
  }
}
