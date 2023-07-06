/* eslint-disable no-param-reassign */
import uniqid from 'uniqid';
import AudioRecorder from 'audio-recorder-polyfill';

/**
 * A function to format raw time to hh-mm-ss
 * @param rawTime
 * @returns {string}
 */
export function formatTime(rawTime) {
  const time = Math.floor(rawTime);
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return (`${((hours < 10) && (hours > 0)) ? '0' : ''}${(hours > 0) ? `${hours}:` : ''}${(minutes < 10) ? '0' : ''}${minutes}:${(seconds < 10) ? '0' : ''}${seconds}`);
}

/**
 * A function to make an animation of appearing and disappearing
 * @param modal
 * @param background
 * @param action
 */
export function animateModals(modal, background, action) {
  switch (action) {
    case 'open': {
      const notNew = Array.from(background).find((item) => item.classList.contains('remove-blur'));
      if (notNew && modal.classList.contains('modal-add')) {
        background.forEach((item) => item.classList.toggle('blur'));
        background.forEach((item) => item.classList.toggle('remove-blur'));
        modal.classList.add('modal-active');
        modal.classList.remove('modal-inactive');
      } else {
        if (notNew) {
          background.forEach((item) => item.classList.remove('remove-blur'));
        }
        background.forEach((item) => item.classList.add('blur'));
        if (modal.classList.contains('modal-inactive')) {
          modal.classList.remove('modal-inactive');
        }
        modal.classList.add('modal-active');
      }
      break;
    }
    case 'close': {
      background.forEach((item) => item.classList.toggle('blur'));
      background.forEach((item) => item.classList.toggle('remove-blur'));
      modal.classList.toggle('modal-active');
      modal.classList.toggle('modal-inactive');
      break;
    }
    default: {
      console.log('Hmm, something else happened with your animation!');
    }
  }
}

/**
 * A function, which collects data, puts it to FormData & sends to a server
 * @param serverHost
 * @param modalFormName
 * @param type
 * @param pipeBlob
 * @param modalFormTextArea
 * @returns {Promise<{name, id: *, type}>} - a data object (without a file - for notes with media)
 */
export async function sendData(serverHost, name, type, pipeBlob, text) {
  const id = uniqid();
  const data = {
    id,
    name,
    type,
  };

  const formData = new FormData();
  Object.entries(data).forEach((chunk) => formData.set(chunk[0], chunk[1]));
  if (data.type === 'text') {
    formData.set('content', text);
    data.content = text;
  } else {
    formData.set('content', pipeBlob);
    data.content = 'media';
  }

  try {
    const res = await fetch(`${serverHost}/chest-of-notes/mongo/add`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    console.log(result);
    if (result.status.includes('Error')) {
      throw Error(result.data);
    }
    if (result.uploadComplete !== undefined) {
      return { ...data, uploadComplete: result.uploadComplete };
    }
    return data;
  } catch (e) {
    console.log(e);
    return e.message;
  }
}

/**
 * A function, which initiates media recording
 * @param media
 * @returns {Promise<{pipeline: *[], mediaRecorder: MediaRecorder}>}
 */
export async function recordSomeMedia(media) {
  const tag = media.tagName.toLowerCase();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: (tag === 'video') });
    if (!window.MediaRecorder) {
      alert('A polyfill is active. You can record only audio files. If you\'re using Safari on iOS you can enable this functionality in its settings (MediaRecorder). Then reload the page');
      window.MediaRecorder = AudioRecorder;
      if (tag === 'video') {
        return null;
      }
    }
    const mediaRecorder = new MediaRecorder(stream);
    const pipeline = [];
    mediaRecorder.start();
    if (tag === 'video') {
      media.srcObject = stream;
      media.muted = true;
      media.play();
    }
    return { mediaRecorder, pipeline };
  } catch (e) {
    alert('You didn\'t allow to record media. You can make only text notes!');
    return null;
  }
}

/**
 * A function for rendering new notes. Adds listeners for 'Delete' buttons & for preview links
 * @param notesList
 * @param data
 * @param pipeBlob
 * @param deleteListener
 * @param previewListener
 * @param masonry
 */
export function render(type, notesList, data, pipeBlob, deleteListener, previewListener, saveListener, masonry) {
  // Level 1 <li.column.notes-list-item></li>
  const notesListItem = document.createElement('li');
  notesListItem.classList.add('column', 'notes-list-item');
  // Level 2
  let notesListItemWrapper;
  // Level 3 <header className="card-header">
  const notesListItemHeader = document.createElement('header');
  notesListItemHeader.classList.add('card-header');
  // Level 4 <p className="card-header-title">
  const cardHeaderTitle = document.createElement('p');
  cardHeaderTitle.classList.add('card-header-title');
  // Level 4 <button className="card-header-icon delete-note" aria-label="delete" type="button">
  const deleteNote = document.createElement('button');
  deleteNote.classList.add('card-header-icon');
  deleteNote.type = 'button';
  // Level 5 <span className="icon">
  const iconContainer = document.createElement('span');
  iconContainer.classList.add('icon');
  // Level 6 <i className="fa-solid fa-trash"></i>
  const icon = document.createElement('i');
  // Level 3 <div className="card-content">
  const cardContent = document.createElement('div');
  cardContent.classList.add('card-content');
  // Level 4
  let notesListItemDescription;

  switch (type) {
    case 'text': {
      const formName = 'addForm';

      notesListItem.classList.add('form');

      // Level 2 <form className="card">
      notesListItemWrapper = document.createElement('form');
      notesListItemWrapper.classList.add('card');
      notesListItemWrapper.name = formName;

      // Level 5 <input class="input" type="text" placeholder="Type the note's name">
      const input = document.createElement('input');
      input.classList.add('input');
      input.type = 'text';
      input.name = 'name';
      input.required = true;
      input.placeholder = 'Type the note\'s name';
      cardHeaderTitle.append(input);

      notesListItem.addEventListener('submit', (event) => event.preventDefault());

      deleteNote.classList.add('cancel');
      deleteNote.ariaLabel = 'cancel';

      icon.classList.add('fa-solid', 'fa-circle-xmark');
      // Level 4 <div className="content">
      notesListItemDescription = document.createElement('div');
      notesListItemDescription.classList.add('content');

      // Level 5 <textarea class="textarea" placeholder="Type the note's content"></textarea>
      const textarea = document.createElement('textarea');
      textarea.classList.add('textarea');
      textarea.name = 'content';
      textarea.placeholder = 'Type the note\'s content';
      notesListItemDescription.append(textarea);

      // Level 4 <div class="control">
      const control = document.createElement('div');
      control.classList.add('control');

      // Level 5 <button class="button save" type="button">Save</button>
      const saveButton = document.createElement('button');
      saveButton.classList.add('button', 'save');
      saveButton.type = 'submit';
      saveButton.textContent = 'Save';

      saveButton.addEventListener('click', () => saveListener(formName, type));

      cardContent.insertAdjacentElement('beforeend', control).append(saveButton);
      deleteNote.addEventListener('click', deleteListener, { once: true });

      break;
    }
    case 'audio': {
      break;
    }
    case 'video': {
      break;
    }
    default: {
      const isText = (data.type === 'text');
      const hasDescription = !!data.content;
      // Level 2 <div className="card notes-list-item-header-wrapper">
      notesListItemWrapper = document.createElement('div');
      notesListItemWrapper.classList.add('card', 'notes-list-item-header-wrapper');
      notesListItemHeader.classList.add('notes-list-item-header');
      cardHeaderTitle.textContent = data.name;
      deleteNote.classList.add('delete-note');
      deleteNote.ariaLabel = 'delete';
      icon.classList.add('fa-solid', 'fa-trash');
      // Level 4 <p/button className="content notes-list-item-description">
      notesListItemDescription = document.createElement((isText) ? 'p' : 'button');
      notesListItemDescription.classList.add('content', 'notes-list-item-description');

      if (notesListItemDescription instanceof HTMLButtonElement) {
        notesListItemDescription.type = 'button';
        notesListItemDescription.classList.add('button');
      }
      if (!hasDescription && isText) {
        notesListItemDescription.classList.add('hidden');
      }

      if (isText) {
        notesListItemDescription.textContent = data.content;
      }

      const deleteButtonListener = () => {
        deleteListener(data.id);
      };
      deleteNote.addEventListener('click', deleteButtonListener, { once: true });

      // New notes shouldn't be available to use before they are ready for it
      if (data.uploadComplete !== undefined) {
        if (data.uploadComplete === false) {
          deleteNote.disabled = true;
          deleteNote.querySelector('svg').style.fill = '#aaaaaa';
          notesListItemDescription.textContent = 'Please, wait — your file is uploading...';
          notesListItemDescription.disabled = true;
        } else {
          notesListItemDescription.classList.add('media-content');
          cardContent.setAttribute('data-id', data.id);
          notesListItemDescription.textContent = 'Click to open the media!';
        }
      }

      if (!isText) {
        const newNoteListener = () => {
          previewListener(data.id, notesListItemDescription, data.type, pipeBlob);
          // previewListener(data.type, pipeBlob, data.id);
        };
        notesListItemDescription.addEventListener('click', newNoteListener);
      }
      break;
    }
  }

  notesListItemWrapper.insertAdjacentElement('beforeend', cardContent)
    .insertAdjacentElement('afterbegin', notesListItemDescription);
  notesListItem.insertAdjacentElement('beforeend', notesListItemWrapper)
    .insertAdjacentElement('afterbegin', notesListItemHeader)
    .insertAdjacentElement('beforeend', cardHeaderTitle)
    .insertAdjacentElement('afterend', deleteNote)
    .insertAdjacentElement('beforeend', iconContainer)
    .insertAdjacentElement('beforeend', icon);

  notesList.append(notesListItem);
  masonry.prepended(notesListItem);

  // // A listener for spoilers is needed to improve accessibility
  // spoiler.addEventListener('keyup', (event) => {
  //   if (event.key === 'Enter' || event.key === ' ') {
  //     checkbox.checked = !checkbox.checked;
  //     const evt = new Event('click', { bubbles: true });
  //     evt.fromKeyboard = true;
  //     checkbox.dispatchEvent(evt);
  //   }
  // });

  // TODO: resizeObserver -> masonry.layout on big text;
}
