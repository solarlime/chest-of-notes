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
export async function sendData(serverHost, modalFormName, type, pipeBlob, modalFormTextArea) {
  const id = uniqid();
  const data = {
    id,
    name: modalFormName.value,
    type,
  };

  const formData = new FormData();
  Object.entries(data).forEach((chunk) => formData.set(chunk[0], chunk[1]));
  if (data.type === 'text') {
    formData.set('content', modalFormTextArea.value);
    data.content = modalFormTextArea.value;
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
export function renderNewNote(notesList, data, pipeBlob, deleteListener, previewListener, masonry) {
  const isText = (data.type === 'text');
  const hasDescription = !!data.content;
  // Level 1 <li.column.notes-list-item></li>
  const notesListItem = document.createElement('li');
  notesListItem.classList.add('column', 'notes-list-item');
  // Level 2 <div className="card">
  const notesListItemWrapper = document.createElement('div');
  notesListItemWrapper.classList.add('card', 'notes-list-item-header-wrapper');
  // Level 3 <header className="card-header">
  const notesListItemHeader = document.createElement('header');
  notesListItemHeader.classList.add('card-header', 'notes-list-item-header');
  // Level 4 <p className="card-header-title">
  const cardHeaderTitle = document.createElement('p');
  cardHeaderTitle.classList.add('card-header-title');
  cardHeaderTitle.textContent = data.name;
  // Level 4 <button className="card-header-icon delete-note" aria-label="delete">
  const deleteNote = document.createElement('button');
  deleteNote.classList.add('card-header-icon', 'delete-note');
  deleteNote.ariaLabel = 'delete';
  deleteNote.type = 'button';
  // Level 5 <span className="icon">
  const iconContainer = document.createElement('span');
  iconContainer.classList.add('icon');
  // Level 6 <i className="fa-solid fa-trash"></i>
  const icon = document.createElement('i');
  icon.classList.add('fa-solid', 'fa-trash');
  // Level 3 <div className="card-content">
  const cardContent = document.createElement('div');
  cardContent.classList.add('card-content');
  // Level 4 <div className="content">
  const notesListItemDescription = document.createElement((isText) ? 'p' : 'button');
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

  notesListItemWrapper.insertAdjacentElement('beforeend', cardContent)
    .insertAdjacentElement('beforeend', notesListItemDescription);
  notesListItem.insertAdjacentElement('beforeend', notesListItemWrapper)
    .insertAdjacentElement('afterbegin', notesListItemHeader)
    .insertAdjacentElement('beforeend', cardHeaderTitle)
    .insertAdjacentElement('afterend', deleteNote)
    .insertAdjacentElement('beforeend', iconContainer)
    .insertAdjacentElement('beforeend', icon);

  notesList.append(notesListItem);
  masonry.appended(notesListItem);

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
      notesListItemDescription.textContent = 'Click to open the media!';
    }
  }

  // // A listener for spoilers is needed to improve accessibility
  // spoiler.addEventListener('keyup', (event) => {
  //   if (event.key === 'Enter' || event.key === ' ') {
  //     checkbox.checked = !checkbox.checked;
  //     const evt = new Event('click', { bubbles: true });
  //     evt.fromKeyboard = true;
  //     checkbox.dispatchEvent(evt);
  //   }
  // });

  // // TODO: resizeObserver -> masonry.layout on big text;
  // if (!isText) {
  //   const newNoteListener = () => {
  //     // TODO: zustand
  //     // previewListener(data.type, pipeBlob, data.id);
  //     notesListItemDescription.textContent = 'Click to close the media!';
  //     const media = document.createElement(data.type);
  //     media.src = `http://localhost:3001/chest-of-notes/mongo/fetch/${data.id}`;
  //     // media.src = `${serverHost}/chest-of-notes/mongo/fetch/${data.id}`;
  //     // media.src = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';
  //     media.controls = true;
  //     media.style.width = '100%';
  //     media.style.borderRadius = '4px';
  //     notesListItemDescription.insertAdjacentElement('afterend', media);
  //     masonry.layout();
  //     const timeout = setTimeout(() => { masonry.layout(); clearTimeout(timeout); }, 500);
  //   };
  //   notesListItemDescription.addEventListener('click', newNoteListener);
  // }
}
