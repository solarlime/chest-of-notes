/* eslint-disable no-param-reassign */
import uniqid from 'uniqid';

export function formatTime(rawTime) {
  const time = Math.floor(rawTime);
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return (`${((hours < 10) && (hours > 0)) ? '0' : ''}${(hours > 0) ? `${hours}:` : ''}${(minutes < 10) ? '0' : ''}${minutes}:${(seconds < 10) ? '0' : ''}${seconds}`);
}

export function animateModals(modal, background, action) {
  switch (action) {
    case 'open': {
      const notNew = Array.from(background).find((item) => item.classList.contains('remove-blur'));
      if (notNew && modal.classList.contains('modal-add')) {
        background.forEach((item) => item.classList.toggle('blur'));
        background.forEach((item) => item.classList.toggle('remove-blur'));
        modal.classList.toggle('modal-active');
        modal.classList.toggle('modal-inactive');
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

export async function sendData(modalFormName, type, pipeBlob, modalFormTextArea) {
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
    data.content = URL.createObjectURL(pipeBlob);
  }

  const res = await fetch('http://localhost:3001/chest-of-notes/mongo/update', {
    method: 'POST',
    body: formData,
  });
  const result = await res.json();
  console.log(result);
  return data;
}

export async function recordSomeMedia(media) {
  const tag = media.tagName.toLowerCase();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: (tag === 'video') });
  const mediaRecorder = new MediaRecorder(stream);
  const pipeline = [];
  mediaRecorder.start();
  if (tag === 'video') {
    media.srcObject = stream;
    media.muted = true;
    media.play();
  }
  return { mediaRecorder, pipeline };
}

export function renderNewNote(notesList, data, deleteListener, previewListener) {
  const isText = (data.type === 'text') ? data.content : 'media';
  const notesListItem = document.createElement('li');
  notesListItem.classList.add('notes-list-item');
  notesListItem.innerHTML = `<input type="checkbox" id="${data.id}" class="checkbox">\n`
    + '                    <div class="notes-list-item-header-wrapper">\n'
    + `                        <h3 class="notes-list-item-header">${data.name}</h3>\n`
    + '                        <div class="notes-list-item-header-buttons">\n'
    + `                            <label class="spoiler ${(!data.content && data.type === 'text') ? 'hidden' : ''}" for="${data.id}">\n`
    + '                                <svg class="spoiler-svg" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 490.656 490.656" xml:space="preserve">\n'
    + '                                    <g><g>\n'
    + '                                        <path d="M487.536,120.445c-4.16-4.16-10.923-4.16-15.083,0L245.339,347.581L18.203,120.467c-4.16-4.16-10.923-4.16-15.083,0    c-4.16,4.16-4.16,10.923,0,15.083l234.667,234.667c2.091,2.069,4.821,3.115,7.552,3.115s5.461-1.045,7.531-3.136l234.667-234.667    C491.696,131.368,491.696,124.605,487.536,120.445z"/>\n'
    + '                                    </g></g>\n'
    + '                                </svg>\n'
    + '                            </label>\n'
    + '                            <div class="delete-note">\n'
    + '                                <svg class="delete-note-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">\n'
    + '                                    <g>\n'
    + '                                        <path d="m424 64h-88v-16c0-26.467-21.533-48-48-48h-64c-26.467 0-48 21.533-48 48v16h-88c-22.056 0-40 17.944-40 40v56c0 8.836 7.164 16 16 16h8.744l13.823 290.283c1.221 25.636 22.281 45.717 47.945 45.717h242.976c25.665 0 46.725-20.081 47.945-45.717l13.823-290.283h8.744c8.836 0 16-7.164 16-16v-56c0-22.056-17.944-40-40-40zm-216-16c0-8.822 7.178-16 16-16h64c8.822 0 16 7.178 16 16v16h-96zm-128 56c0-4.411 3.589-8 8-8h336c4.411 0 8 3.589 8 8v40c-4.931 0-331.567 0-352 0zm313.469 360.761c-.407 8.545-7.427 15.239-15.981 15.239h-242.976c-8.555 0-15.575-6.694-15.981-15.239l-13.751-288.761h302.44z"/>\n'
    + '                                        <path d="m256 448c8.836 0 16-7.164 16-16v-208c0-8.836-7.164-16-16-16s-16 7.164-16 16v208c0 8.836 7.163 16 16 16z"/>\n'
    + '                                        <path d="m336 448c8.836 0 16-7.164 16-16v-208c0-8.836-7.164-16-16-16s-16 7.164-16 16v208c0 8.836 7.163 16 16 16z"/>\n'
    + '                                        <path d="m176 448c8.836 0 16-7.164 16-16v-208c0-8.836-7.164-16-16-16s-16 7.164-16 16v208c0 8.836 7.163 16 16 16z"/>\n'
    + '                                    </g>\n'
    + '                                </svg>\n'
    + '                            </div>\n'
    + '                        </div>\n'
    + '                    </div>\n'
    + `                    <p class="notes-list-item-description${(!data.content && data.type === 'text') ? ' hidden' : ''}">${(isText !== 'media') ? isText : 'Click to open the media!'}</p>`;
  notesList.append(notesListItem);

  const deleteButton = notesListItem.querySelector('.delete-note');
  const deleteButtonListener = () => {
    deleteListener(data.id);
  };
  deleteButton.addEventListener('click', deleteButtonListener, { once: true });

  if (isText === 'media') {
    const mediaContent = notesListItem.querySelector('.notes-list-item-description');
    mediaContent.classList.add('media-content');
    const newNoteListener = () => {
      previewListener(data.type, data.content, data.id);
    };
    mediaContent.addEventListener('click', newNoteListener);
  }
}
