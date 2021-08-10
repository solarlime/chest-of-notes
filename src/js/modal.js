/* eslint-disable no-param-reassign */
import validator from 'validator';
import Media from './media';
import {
  animateModals, recordSomeMedia, renderNewNote, sendData,
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

    this.background = page.querySelectorAll('section, footer');
    this.notesList = page.querySelector('.notes-list');
    this.emptyList = page.querySelector('.notes-empty-list');
  }

  /**
   * A function to resolve, what appearance is needed for an adding modal now
   */
  openModal(button, contentButtons, previewListener) {
    const [audioButton, videoButton, textButton] = contentButtons;

    /**
     * A wrapper for a data sending function. Also calls rendering a new note
     */
    this.sendDataWrapper = async (event) => {
      event.preventDefault();
      // eslint-disable-next-line max-len
      const data = await sendData(this.modalFormName, this.type, this.pipeBlob, this.modalFormTextArea);
      this.modalCloseButton.dispatchEvent(new Event('click'));
      if (!this.emptyList.classList.contains('hidden')) {
        this.emptyList.style.visibility = '';
        [this.emptyList, this.notesList].forEach((item) => item.classList.toggle('hidden'));
      }
      renderNewNote(this.notesList, data, previewListener);
    };

    /**
     * A function to close the content modal
     */
    this.closeModal = (event) => {
      event.preventDefault();
      animateModals(this.modalAdd, this.background, 'close');

      if (this.media) this.media.removeMedia();
      // Stop media recording if it's not stopped (early closing)
      if (this.mediaRecorder) {
        if (this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
        this.mediaRecorder.removeEventListener('dataavailable', this.recorder);
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
        this.media = new Media(this.modalAdd, 'modal', this.type);
        this.mediaElement = this.media.mediaElement;
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
        this.media = new Media(this.modalAdd, 'modal', this.type);
        this.mediaElement = this.media.mediaElement;
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
        const { mediaRecorder, pipeline } = await recordSomeMedia(this.mediaElement);
        this.mediaRecorder = mediaRecorder;
        this.modalStartButton.classList.add('hidden');
        this.modalStopButton.classList.remove('hidden');

        // Collect the data into a Blob
        this.recorder = (event) => {
          pipeline.push(event.data);
          if (this.mediaRecorder.state === 'inactive') {
            if (this.media.mediaElement) {
              this.pipeBlob = new Blob(pipeline, { type: 'audio/mp4' });
              this.mediaElement.src = URL.createObjectURL(this.pipeBlob);
              this.mediaElement.srcObject = null;
              this.media.addMediaElementListeners(this.mediaElement.src);
              this.media.addPlayerListeners();
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
}
