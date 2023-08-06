/* eslint-disable no-param-reassign */
import validator from 'validator';
import Media from './media';
import {
  animateModals, recordSomeMedia, render, sendData,
} from './utils';

export default class Modal {
  constructor(serverHost, page, store, masonry) {
    this.page = page;
    this.store = store;
    this.serverHost = serverHost;
    this.modalAdd = this.page.querySelector('.modal-add');
    this.modalAddForm = this.page.querySelector('.modal-add-form');
    this.modalAddFormHeader = this.page.querySelector('.modal-add-form-header');
    this.modalFormName = this.page.querySelector('#modal-add-form-input');
    this.modalFormTextArea = this.page.querySelector('#modal-add-form-text-area');
    this.modalFormText = this.page.querySelector('.modal-add-form-text');
    this.modalFormDescriptionBoth = this.page.querySelector('.modal-add-form-description-both');
    this.modalFormDescriptionMedia = this.page.querySelector('.modal-add-form-description-media');
    this.modalFormMedia = this.page.querySelector('.modal-add-form-media');
    this.modalStartButton = this.page.querySelector('button.start');
    this.modalStopButton = this.page.querySelector('button.stop');
    this.modalSaveButton = this.page.querySelector('button.save');
    this.masonry = masonry;

    this.media = null;
    this.pipeBlob = null;

    this.background = page.querySelectorAll('section, footer');
    this.notesList = page.querySelector('.notes-list');
    this.emptyList = page.querySelector('.notes-empty-list');
  }

  /**
   * A function to resolve, what appearance is needed for an adding modal now
   */
  openForm(serverHost, button, contentButtons, deleteListener, previewListener) {
    /**
     * A wrapper for a media recording function
     */
    const mediaRecorderWrapper = async (mediaElement, cancelButton, startStopButton, saveButton) => {
      console.log('Recording!');
      if (!navigator.mediaDevices) {
        alert('Your browser can\'t deal with media functions!');
        cancelButton.dispatchEvent(new Event('click'));
        return;
      }
      try {
        const recorder = await recordSomeMedia(mediaElement);
        if (!recorder) {
          cancelButton.dispatchEvent(new Event('click'));
        } else {
          const { mediaRecorder, pipeline } = recorder;

          // this.modalStartButton.classList.add('hidden');
          // this.modalStopButton.classList.remove('hidden');
          // this.modalFormDescriptionMedia.classList.add('hidden');
          // this.modalStopButton.focus();

          // Collect the data into a Blob
          const recorderListener = (event) => {
            pipeline.push(event.data);
            if (mediaRecorder.state === 'inactive') {
              if (mediaElement) {
                // At first, we need to turn camera off
                if (mediaElement.srcObject) {
                  const tracks = mediaElement.srcObject.getTracks();
                  tracks.forEach((track) => track.stop());
                }
                this.pipeBlob = new Blob(pipeline, { type: `${mediaElement.tagName.toLowerCase()}/mp4` });
                mediaElement.src = URL.createObjectURL(this.pipeBlob);
                mediaElement.srcObject = null;
                // this.media.addMediaElementListeners(mediaElement.src);
                // this.media.addPlayerListeners();
                if (this.pipeBlob.size > 50 * 1024 * 1024) {
                  // this.modalFormDescriptionBoth.classList.add('hidden');
                  alert('Your record is too big, so you can\'t save it. Try to make a smaller one!');
                } else {
                  // this.modalSaveButton.classList.remove('hidden');
                  // this.modalSaveButton.focus();
                }
              }
            }
          };
          mediaRecorder.addEventListener('dataavailable', recorderListener);

          /**
           * A wrapper for a 'stop recording' function
           */
          const stopListener = () => {
            mediaRecorder.stop();
            mediaElement.muted = false;
            mediaElement.controls = true;
            saveButton.classList.remove('is-hidden');
            startStopButton.classList.add('is-hidden');
            // this.modalStopButton.classList.add('hidden');

            // this.modalSaveButton.addEventListener('click', this.sendDataWrapper);
            // // After saving remove a listener for stopping
            // this.modalStopButton.removeEventListener('click', this.stopListener);
          };
          startStopButton.textContent = 'Stop';
          startStopButton.addEventListener('click', stopListener, { once: true });
          // this.modalStopButton.addEventListener('click', this.stopListener);
          // // After stopping remove a listener for recording
          // this.modalStartButton.removeEventListener('click', this.mediaRecorderWrapper);
        }
      } catch (e) {
        console.log(e);
      }
    };
    // this.modalStartButton.addEventListener('click', this.mediaRecorderWrapper);
    // this.modalCloseButton.addEventListener('click', this.closeModal);

    const cancelListener = (event) => {
      const form = event.target.closest('.form');
      this.masonry.remove(form);
      // If event.isTrusted === true => form is replacing with a note => is no need to trigger masonry
      if (event.isTrusted) this.masonry.layout();
    };

    const saveListener = async (formName, type, cancelButton) => {
      const { nameField, content } = document.forms[formName];
      const data = await sendData(serverHost, nameField.value, type, this.pipeBlob, content);
      cancelButton.dispatchEvent(new Event('click'));
      if (typeof data === 'string') {
        alert(`Your note wasn't saved. Server response: ${data}`);
      } else {
        const { deleteNote: deleteButton, notesListItemDescription: previewButton } = render(
          'note',
          this.notesList,
          data,
          this.pipeBlob,
          this.masonry,
        );
        deleteButton.addEventListener('click', (event) => deleteListener(event, data.id), { once: true });
        if (previewButton instanceof HTMLButtonElement) {
          previewButton.addEventListener('click', () => previewListener(data.id, previewButton, data.type, this.pipeBlob));
        }
        this.store.setState((previous) => ({ ...previous, items: [...previous.items, data] }));
      }
    };

    const {
      notesListItemWrapper: form, deleteNote: cancelButton, media: mediaElement, startButton, saveButton,
    } = render(
      button.name,
      this.notesList,
      null,
      null,
      this.masonry,
    );
    form.addEventListener('submit', (event) => { event.preventDefault(); });
    cancelButton.addEventListener('click', cancelListener, { once: true });
    if (startButton) {
      startButton.addEventListener('click', () => mediaRecorderWrapper(mediaElement, cancelButton, startButton, saveButton), { once: true });
    }
    saveButton.addEventListener('click', () => saveListener(form.name, button.name, cancelButton));
    form.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // const [audioButton, videoButton, textButton] = contentButtons;
    //
    // /**
    //  * A wrapper for a data sending function. Also calls rendering a new note
    //  */
    // this.sendDataWrapper = async (event) => {
    //   event.preventDefault();
    //   // eslint-disable-next-line max-len
    //   const data = await sendData(serverHost, this.modalFormName, this.type, this.pipeBlob, this.modalFormTextArea);
    //   this.modalCloseButton.dispatchEvent(new Event('click'));
    //   if (!this.emptyList.classList.contains('hidden')) {
    //     this.emptyList.style.visibility = '';
    //     [this.emptyList, this.notesList].forEach((item) => item.classList.toggle('hidden'));
    //   }
    //   if (typeof data === 'string') {
    //     alert(`Your note wasn't saved. Server response: ${data}`);
    //   } else {
    //     render(
    //       // TODO: replace 'type'
    //       'type',
    //       this.notesList,
    //       data,
    //       this.pipeBlob,
    //       deleteListener,
    //       previewListener,
    //       this.masonry,
    //     );
    //   }
    // };
    //
    // /**
    //  * A function to close the content modal
    //  */
    // this.closeModal = (event) => {
    //   event.preventDefault();
    //   animateModals(this.modalAdd, this.background, 'close');
    //
    //   if (this.media) this.media.removeMedia();
    //   // Stop media recording if it's not stopped (early closing)
    //   if (this.mediaRecorder) {
    //     if (this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
    //     this.mediaRecorder.removeEventListener('dataavailable', this.recorder);
    //   }
    //   // Clean the fields after saving
    //   if (!event.isTrusted) {
    //     [this.modalFormName, this.modalFormTextArea].forEach((item) => { item.value = ''; });
    //   }
    //   // Give some time for an animation to end
    //   setTimeout(() => {
    //     // eslint-disable-next-line max-len
    //     [this.modalFormText, this.modalStartButton, this.modalFormDescriptionMedia]
    //       .forEach((item) => (item.classList.contains('hidden') ? item.classList.remove('hidden') : null));
    //     if (!this.modalStopButton.classList.contains('hidden')) {
    //       this.modalStopButton.classList.add('hidden');
    //     }
    //     for (const item of this.modalAddForm.children) {
    //       item.classList.add('hidden');
    //     }
    //     // Disable the save button by default
    //     this.modalSaveButton.disabled = true;
    //     if (this.modalSaveButton.classList.contains('hidden')) {
    //       this.modalSaveButton.classList.remove('hidden');
    //     }
    //     // Specially for mobiles: sometimes layout goes mad
    //     window.dispatchEvent(new Event('resize'));
    //   }, 500);
    //   // After closing remove listeners
    //   this.modalStartButton.removeEventListener('click', this.mediaRecorderWrapper);
    //   this.modalStopButton.removeEventListener('click', this.stopListener);
    //   this.modalSaveButton.removeEventListener('click', this.sendDataWrapper);
    //   this.modalCloseButton.removeEventListener('click', this.closeModal);
    //   this.modalAddForm.removeEventListener('submit', this.preventSubmit);
    // };
    //
    // /**
    //  * A wrapper for validating the note's header strings
    //  */
    // const validatorWrapper = () => {
    //   const string = this.modalFormName.value.trim();
    //   this.modalSaveButton.disabled = validator.isEmpty(string)
    //     || !validator.isLength(string, { min: 1, max: 60 });
    // };
    // this.modalFormName.addEventListener('input', validatorWrapper);
    //
    // /**
    //  * A wrapper to prevent submitting
    //  */
    // this.preventSubmit = (event) => {
    //   event.preventDefault();
    // };
    // this.modalAddForm.addEventListener('submit', this.preventSubmit);
    //
    // switch (button) {
    //   case audioButton: {
    //     [this.modalAddFormHeader,
    //       this.modalFormName,
    //       this.modalFormMedia,
    //       this.modalFormDescriptionMedia,
    //       this.modalFormDescriptionBoth,
    //     ].forEach((item) => item.classList.remove('hidden'));
    //     this.type = 'audio';
    //     this.media = new Media(this.modalAdd, 'modal', this.type);
    //     this.mediaElement = this.media.mediaElement;
    //     this.modalSaveButton.classList.add('hidden');
    //     break;
    //   }
    //   case videoButton: {
    //     [
    //       this.modalAddFormHeader,
    //       this.modalFormName,
    //       this.modalFormMedia,
    //       this.modalFormDescriptionMedia,
    //       this.modalFormDescriptionBoth,
    //     ].forEach((item) => item.classList.remove('hidden'));
    //     this.type = 'video';
    //     this.media = new Media(this.modalAdd, 'modal', this.type);
    //     this.mediaElement = this.media.mediaElement;
    //     this.modalSaveButton.classList.add('hidden');
    //     break;
    //   }
    //   case textButton: {
    //     [
    //       this.modalAddFormHeader,
    //       this.modalFormName,
    //       this.modalFormText,
    //       this.modalFormMedia,
    //       this.modalFormDescriptionBoth,
    //     ].forEach((item) => item.classList.remove('hidden'));
    //     [this.modalStartButton, this.modalStopButton].forEach((item) => item.classList.add('hidden'));
    //     this.type = 'text';
    //     this.modalSaveButton.addEventListener('click', this.sendDataWrapper);
    //     this.modalCloseButton.addEventListener('click', this.closeModal);
    //     break;
    //   }
    //   default: {
    //     console.log('Hmm, something else happened!');
    //   }
    // }
    // if (this.modalFormName.value.trim()) {
    //   this.modalSaveButton.disabled = false;
    // }
    // const timeout = setTimeout(() => {
    //   clearTimeout(timeout);
    //   this.modalFormName.focus();
    // }, 500);
    // return { modalAdd: this.modalAdd, type: this.type };
  }
}
