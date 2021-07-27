/* eslint-disable no-param-reassign */
import getBlobDuration from 'get-blob-duration';
import validator from 'validator';
import {
  addMediaElement, formatTime, recordSomeMedia, renderNewNote, sendData,
} from './utils';

export default class Modal {
  constructor(page) {
    this.modalAdd = page.querySelector('.modal-add');
    this.modalAddForm = page.querySelector('.modal-add-form');
    this.modalAddFormHeader = page.querySelector('.modal-add-form-header');
    this.modalFormName = page.querySelector('#modal-add-form-input');
    this.modalFormTextArea = page.querySelector('#modal-add-form-text-area');
    this.modalFormText = page.querySelector('.modal-add-form-text');
    this.modalFormDescriptionBoth = page.querySelector('.modal-add-form-description-both');
    this.modalFormDescriptionMedia = page.querySelector('.modal-add-form-description-media');
    this.modalFormMedia = page.querySelector('.modal-add-form-media');
    this.modalStartButton = page.querySelector('button.start');
    this.modalStopButton = page.querySelector('button.stop');
    this.modalSaveButton = page.querySelector('button.save');
    this.modalCloseButton = page.querySelector('button.close');

    this.media = null;
    this.pipeBlob = null;
    this.listenerFunctions = null;
    this.player = this.modalAdd.querySelector('.modal-player');
    this.play = this.modalAdd.querySelector('button.modal-player-play');
    this.pause = this.modalAdd.querySelector('button.modal-player-pause');
    this.back = this.modalAdd.querySelector('button.modal-player-back');
    this.forward = this.modalAdd.querySelector('button.modal-player-forward');
    this.time = this.modalAdd.querySelector('.modal-player-time');
    this.duration = this.modalAdd.querySelector('.modal-player-duration');

    this.background = page.querySelectorAll('section, footer');
    this.notesList = page.querySelector('.notes-list');
  }

  /**
   * A function to resolve, what appearance is needed for an adding modal now
   */
  openModal(button, contentButtons) {
    const [audioButton, videoButton, textButton] = contentButtons;

    /**
     * A wrapper for a data sending function. Also calls rendering a new note
     */
    this.sendDataWrapper = async (event) => {
      event.preventDefault();
      // eslint-disable-next-line max-len
      const data = await sendData(this.modalFormName, this.type, this.pipeBlob, this.modalFormTextArea);
      this.modalCloseButton.dispatchEvent(new Event('click'));
      const { notesListItem, isText } = renderNewNote(this.notesList, data);

      if (!isText) {
        const mediaContent = notesListItem.querySelector('.notes-list-item-description');
        mediaContent.classList.add('media-content');
        mediaContent.parentElement.setAttribute('data-content', data.content);
        const newNoteListener = () => {
          this.dataContent = mediaContent.parentElement.getAttribute('data-content');
          console.log(this.dataContent);
        };
        mediaContent.addEventListener('click', newNoteListener);
      }
    };

    /**
     * A function to close the content modal
     */
    this.closeModal = (event) => {
      event.preventDefault();
      this.background.forEach((item) => item.classList.toggle('blur'));
      this.background.forEach((item) => item.classList.toggle('remove-blur'));
      this.modalAdd.classList.toggle('modal-active');
      this.modalAdd.classList.toggle('modal-inactive');
      // Stop media recording if it's not stopped (early closing)
      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
        this.mediaRecorder.removeEventListener('dataavailable', this.recorder);
      }
      // Pause, if the media was playing
      this.pause.dispatchEvent(new Event('click'));
      // Remove player's listeners
      if (this.listenerFunctions) {
        [this.play, this.pause, this.back, this.forward]
          .forEach((element, i) => element.removeEventListener('click', this.listenerFunctions[i]));
        ['play', 'pause'].forEach((evt, i) => this.media.removeEventListener(evt, this.listenerFunctions[i]));
        this.listenerFunctions = null;
      }
      // Remove the media element
      if (this.media) {
        this.media.remove();
        this.media = null;
        this.time.textContent = '00:00';
        this.duration.textContent = '00:00';
        this.player.classList.add('hidden');
      }
      // Clean the fields after saving
      if (!event.isTrusted) {
        [this.modalFormName, this.modalFormTextArea].forEach((item) => { item.value = ''; });
      }
      // Give some time for an animation to end
      setTimeout(() => {
        // eslint-disable-next-line max-len
        [this.modalFormText, this.modalStartButton, this.modalFormDescriptionMedia]
          .forEach((item) => (item.classList.contains('hidden') ? item.classList.remove('hidden') : null));
        if (!this.modalStopButton.classList.contains('hidden')) {
          this.modalStopButton.classList.add('hidden');
        }
        for (const item of this.modalAddForm.children) {
          item.classList.add('hidden');
        }
        // Disable the save button by default
        this.modalSaveButton.disabled = true;
        if (this.modalSaveButton.classList.contains('hidden')) {
          this.modalSaveButton.classList.remove('hidden');
        }
      }, 500);
      // After closing remove listeners
      this.modalStartButton.removeEventListener('click', this.mediaRecorderWrapper);
      this.modalStopButton.removeEventListener('click', this.stopListener);
      this.modalSaveButton.removeEventListener('click', this.sendDataWrapper);
      this.modalCloseButton.removeEventListener('click', this.closeModal);
      this.modalAddForm.removeEventListener('submit', this.preventSubmit);
    };

    /**
     * A wrapper for validating the note's header strings
     */
    const validatorWrapper = () => {
      const string = this.modalFormName.value.trim();
      this.modalSaveButton.disabled = validator.isEmpty(string)
          || !validator.isLength(string, { min: 1, max: 60 });
    };
    this.modalFormName.addEventListener('input', validatorWrapper);

    /**
     * A wrapper to prevent submitting
     */
    this.preventSubmit = (event) => {
      event.preventDefault();
    };
    this.modalAddForm.addEventListener('submit', this.preventSubmit);

    switch (button) {
      case audioButton: {
        [this.modalAddFormHeader,
          this.modalFormName,
          this.modalFormMedia,
          this.modalFormDescriptionMedia,
          this.modalFormDescriptionBoth,
        ].forEach((item) => item.classList.remove('hidden'));
        this.type = 'audio';
        this.media = addMediaElement(this.type, this.player);
        this.modalSaveButton.classList.add('hidden');
        break;
      }
      case videoButton: {
        [
          this.modalAddFormHeader,
          this.modalFormName,
          this.modalFormMedia,
          this.modalFormDescriptionMedia,
          this.modalFormDescriptionBoth,
        ].forEach((item) => item.classList.remove('hidden'));
        this.type = 'video';
        this.media = addMediaElement(this.type, this.player);
        this.modalSaveButton.classList.add('hidden');
        break;
      }
      case textButton: {
        [
          this.modalAddFormHeader,
          this.modalFormName,
          this.modalFormText,
          this.modalFormMedia,
          this.modalFormDescriptionBoth,
        ].forEach((item) => item.classList.remove('hidden'));
        [this.modalStartButton, this.modalStopButton].forEach((item) => item.classList.add('hidden'));
        this.type = 'text';
        this.modalSaveButton.addEventListener('click', this.sendDataWrapper);
        this.modalCloseButton.addEventListener('click', this.closeModal);
        break;
      }
      default: {
        console.log('Hmm, something else happened!');
      }
    }
    if (this.modalFormName.value.trim()) {
      this.modalSaveButton.disabled = false;
    }
    return { modalAdd: this.modalAdd, type: this.type };
  }

  /**
   * A function to add listeners for modal buttons
   */
  addModalButtonListeners() {
    /**
     * A wrapper for a media recording function
     */
    this.mediaRecorderWrapper = async () => {
      if (!navigator.mediaDevices) {
        alert('Your browser can\'t deal with media functions!');
        return;
      }
      try {
        const { mediaRecorder, pipeline } = await recordSomeMedia(this.media);
        this.mediaRecorder = mediaRecorder;
        this.modalStartButton.classList.add('hidden');
        this.modalStopButton.classList.remove('hidden');

        // Collect the data into a Blob
        this.recorder = (event) => {
          pipeline.push(event.data);
          if (this.mediaRecorder.state === 'inactive') {
            if (this.media) {
              this.pipeBlob = new Blob(pipeline, { type: 'audio/mp4' });
              this.media.src = URL.createObjectURL(this.pipeBlob);
              this.media.srcObject = null;
            }
          }
        };
        this.mediaRecorder.addEventListener('dataavailable', this.recorder);

        /**
         * A wrapper for a 'stop recording' function
         */
        this.stopListener = () => {
          this.mediaRecorder.stop();
          this.modalStopButton.classList.add('hidden');
          this.modalSaveButton.classList.remove('hidden');
          this.addMediaElementListeners();
          this.listenerFunctions = this.addPlayerListeners();

          this.modalSaveButton.addEventListener('click', this.sendDataWrapper);
          // After saving remove a listener for stopping
          this.modalStopButton.removeEventListener('click', this.stopListener);
        };
        this.modalStopButton.addEventListener('click', this.stopListener);
        // After stopping remove a listener for recording
        this.modalStartButton.removeEventListener('click', this.mediaRecorderWrapper);
      } catch (e) {
        console.log(e);
      }
    };
    this.modalStartButton.addEventListener('click', this.mediaRecorderWrapper);
    this.modalCloseButton.addEventListener('click', this.closeModal);
  }

  /**
   * A function for adding listeners to player buttons
   */
  addPlayerListeners() {
    const play = () => {
      this.media.play();
      this.play.classList.add('hidden');
      this.pause.classList.remove('hidden');
    };
    const pause = () => {
      this.media.pause();
      this.pause.classList.add('hidden');
      this.play.classList.remove('hidden');
    };
    const back = () => {
      if (this.media.currentTime > 5) {
        this.media.currentTime -= 5;
      } else {
        this.media.currentTime = 0;
      }
    };
    const forward = () => {
      if (this.media.currentTime < this.media.duration - 5) {
        this.media.currentTime += 5;
      } else {
        this.media.currentTime = this.media.duration;
        this.pause.classList.add('hidden');
        this.play.classList.remove('hidden');
      }
    };

    this.play.addEventListener('click', play);
    this.pause.addEventListener('click', pause);
    this.back.addEventListener('click', back);
    this.forward.addEventListener('click', forward);

    this.media.addEventListener('play', play);
    this.media.addEventListener('pause', pause);
    return [play, pause, back, forward];
  }

  addMediaElementListeners() {
    const canplay = () => {
      // A bugfix for Chromium: it can't get the duration
      if (this.media.duration === Infinity) {
        (async () => {
          const duration = await getBlobDuration(this.pipeBlob);
          this.duration.textContent = formatTime(parseInt(duration, 10));
        })();
      } else {
        this.duration.textContent = formatTime(parseInt(this.media.duration, 10));
      }
      if (this.player.classList.contains('hidden')) {
        this.player.classList.remove('hidden');
      }
    };
    const timeupdate = () => {
      if (this.duration.textContent !== '00:00') {
        const time = formatTime(parseInt(this.media.currentTime, 10));
        if (this.time.textContent !== `${time} `) this.time.textContent = `${time} `;
      }
    };
    const ended = () => {
      this.pause.classList.add('hidden');
      this.play.classList.remove('hidden');
    };
    this.media.addEventListener('canplay', canplay);
    this.media.addEventListener('timeupdate', timeupdate);
    this.media.addEventListener('ended', ended);
  }
}
