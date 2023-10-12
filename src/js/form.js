/* eslint-disable no-param-reassign */
import validator from 'validator';
import {
  recordSomeMedia, render, sendData, showMessage,
} from './utils';

export default class Form {
  constructor(serverHost, notesList, store, masonry, type, deleteListener, previewListener) {
    this.serverHost = serverHost;
    this.notesList = notesList;
    this.store = store;
    this.masonry = masonry;

    this.media = null;
    this.pipeBlob = null;

    this._createForm(type, deleteListener, previewListener);
  }

  /**
   * A function to resolve, what appearance is needed for an adding modal now
   */
  _createForm(formType, deleteListener, previewListener) {
    /**
     * A wrapper for a media recording function
     */
    const mediaRecorderWrapper = async (
      mediaElement,
      cancelButton,
      startStopButton,
      saveButton,
    ) => {
      if (!navigator.mediaDevices) {
        await showMessage('error', 'Your browser can\'t deal with media functions!');
        cancelButton.dispatchEvent(new Event('click'));
        return;
      }
      try {
        const recorder = await recordSomeMedia(mediaElement);
        if (!recorder) {
          cancelButton.dispatchEvent(new Event('click'));
          this.masonry.layout();
        } else {
          const { mediaRecorder, pipeline } = recorder;
          const timeoutOnStart = setTimeout(() => {
            this.masonry.layout();
            clearTimeout(timeoutOnStart);
          }, 500);

          // Collect the data into a Blob
          const recorderListener = async (event) => {
            const timeoutOnEnd = setTimeout(() => {
              this.masonry.layout();
              clearTimeout(timeoutOnEnd);
            }, 500);
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
                if (this.pipeBlob.size > 50 * 1024 * 1024) {
                  await showMessage('error', 'Your record is too big, so you can\'t save it. Try to make a smaller one!');
                  cancelButton.dispatchEvent(new Event('click'));
                  this.masonry.layout();
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
          };
          startStopButton.textContent = 'Stop';
          startStopButton.addEventListener('click', stopListener, { once: true });
        }
      } catch (e) {
        console.error(e);
      }
    };

    // Listeners for form buttons
    const cancelListener = (event) => {
      const form = event.target.closest('.form');
      this.masonry.remove(form);
      // If event.isTrusted === true => form is not replaced with a note => need to update store
      if (event.isTrusted) {
        this.store.setState((previous) => ({ ...previous, form: previous.form - 1 }));
      }
    };

    const saveListener = async (formName, type, cancelButton) => {
      const { nameField, content } = document.forms[formName];
      const data = await sendData(this.serverHost, nameField.value, type, this.pipeBlob, content);
      cancelButton.dispatchEvent(new Event('click'));
      if (typeof data === 'string') {
        await showMessage('error', `Your note wasn't saved. Server response: ${data}`);
        this.masonry.layout();
      } else {
        const { deleteNote: deleteButton, notesListItemDescription: previewButton } = render(
          'note',
          this.notesList,
          data,
          this.pipeBlob,
          this.masonry,
        );
        deleteButton.addEventListener('click', (event) => deleteListener(event, data.id));
        if (previewButton instanceof HTMLButtonElement) {
          previewButton.addEventListener('click', () => previewListener(data.id, previewButton, data.type, this.pipeBlob));
        }
        this.store.setState((previous) => ({
          ...previous,
          form: previous.form - 1,
          items: [...previous.items, data],
        }));
      }
    };

    const {
      notesListItemWrapper: form,
      input,
      deleteNote: cancelButton,
      media: mediaElement,
      startButton,
      saveButton,
    } = render(
      formType,
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
    saveButton.addEventListener('click', () => saveListener(form.name, formType, cancelButton));

    /**
     * A wrapper for validating the note's header strings
     */
    const validatorWrapper = () => {
      const string = input.value.trim();
      saveButton.disabled = validator.isEmpty(string)
        || !validator.isLength(string, { min: 1, max: 60 });
    };
    input.addEventListener('input', validatorWrapper);
    input.focus();

    form.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }
}
