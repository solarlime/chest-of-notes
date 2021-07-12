/* eslint-disable no-param-reassign */
import uniqid from 'uniqid';
import { formatTime, addMediaElement } from './utils';

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
    this.modalFormName = this.modalAdd.querySelector('#modal-add-form-input');
    this.modalFormTextArea = this.modalAdd.querySelector('#modal-add-form-text-area');
    this.modalFormText = this.page.querySelector('.modal-add-form-text');
    this.modalFormDescriptionMedia = this.page.querySelector('.modal-add-form-description-media');
    this.modalStartButton = this.page.querySelector('button.start');
    this.modalStopButton = this.page.querySelector('button.stop');
    this.modalSaveButton = this.page.querySelector('button.save');
    this.modalCloseButton = this.page.querySelector('button.close');
    this.notesList = this.page.querySelector('.notes-list');
    this.footerLogo = this.page.querySelector('.footer-logo');
    this.about = this.page.querySelector('.about');
    this.player = this.modalAdd.querySelector('.modal-player');
    this.play = this.modalAdd.querySelector('button.modal-player-play');
    this.pause = this.modalAdd.querySelector('button.modal-player-pause');
    this.back = this.modalAdd.querySelector('button.modal-player-back');
    this.forward = this.modalAdd.querySelector('button.modal-player-forward');
    this.time = this.modalAdd.querySelector('.modal-player-time');
    this.duration = this.modalAdd.querySelector('.modal-player-duration');

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
          this.modalFormText.classList.add('hidden');
          this.type = 'audio';
          this.media = addMediaElement(this.type, this.player);
          break;
        }
        case this.videoButton: {
          this.modalFormText.classList.add('hidden');
          this.type = 'video';
          this.media = addMediaElement(this.type, this.player);
          break;
        }
        case this.textButton: {
          [this.modalStartButton, this.modalStopButton, this.modalFormDescriptionMedia].forEach((item) => item.classList.add('hidden'));
          this.type = 'text';
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

        fileReader.addEventListener('loadend', async () => {
          data.content = fileReader.result;
          await callback();
        });

        fileReader.readAsDataURL(new File([this.pipeBlob], `${id}.mp4`));
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
        this.data = data;
        mediaContent.addEventListener('click', () => this[`${data.type}Button`].dispatchEvent(new Event('click')));
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
        this.media.remove();
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
      }, 500);
    });
  }

  addMediaElementListeners() {
    this.media.addEventListener('canplay', () => {
      this.duration.textContent = formatTime(this.media.duration);
      this.player.classList.remove('hidden');
    });

    this.media.addEventListener('timeupdate', () => {
      const time = formatTime(this.media.currentTime);
      if (this.time.textContent !== `${time} `) this.time.textContent = `${time} `;
    });

    this.media.addEventListener('ended', () => {
      this.pause.classList.add('hidden');
      this.play.classList.remove('hidden');
    });
  }
}
