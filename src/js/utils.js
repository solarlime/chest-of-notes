/* eslint-disable no-param-reassign */
/* eslint-disable prefer-promise-reject-errors */
import uniqid from 'uniqid';

// At first, it is needed to subscribe on server notifications
// Without this feature, the app freezes when a big file is sent
export async function subscribeOnNotifications(serverHost, notesList) {
  return new Promise((resolve) => {
    const client = new WebSocket(`${serverHost.replace('http', 'ws')}/chest-of-notes/`);

    client.addEventListener('open', () => {
      client.addEventListener('message', (message) => {
        const data = JSON.parse(message.data);
        if (data.users) {
          if (data.users > 1) {
            const text = 'Server denied to subscribe on notifications: somebody has already connected.';
            console.log(text);
            client.close(1000, 'Somebody has already connected');
            resolve('deny');
            const timeout = setTimeout(() => { clearTimeout(timeout); alert(text); }, 500);
          } else {
            console.log('Subscribed on notifications!');
            client.addEventListener('close', () => {
              console.log('Connection was closed!');
              const confirmation = window.confirm('A server connection was lost. Do you want reload the page and try to connect again?');
              if (confirmation) window.location.reload();
            });
            const timeout = setTimeout(() => { clearTimeout(timeout); resolve('allow'); }, 500);
          }
        }
        if (data.event) {
          if (data.event.name === 'uploaderror') {
            const text = `An error occurred with a file from the note "${data.event.note}". ${data.event.message}`;
            console.log(text);
            alert(text);
            notesList.dispatchEvent(new CustomEvent('clearIncomplete', { detail: { id: data.event.id } }));
          }
          if (data.event.name === 'uploadsuccess') {
            console.log(`Successfully saved a file from the note "${data.event.note}"!`);
            const descriptionToEdit = notesList.querySelector(`[data-id="${data.event.id}"] .notes-list-item-description`);
            const deleteNote = descriptionToEdit.closest('li').querySelector('.delete-note');
            deleteNote.querySelector('i').style.color = '';
            deleteNote.disabled = false;
            descriptionToEdit.textContent = 'Click to open the media!';
            descriptionToEdit.classList.add('media-content');
            descriptionToEdit.disabled = false;
          }
        }
      });
      client.addEventListener('error', () => {
        const text = 'An error occurred with a notifications\' subscription.';
        console.log(text);
        alert(text);
        resolve('deny');
      });
    });
  });
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
export async function sendData(serverHost, name, type, pipeBlob, textArea) {
  const id = uniqid();
  const data = { id, name, type };

  const formData = new FormData();
  Object.entries(data).forEach((chunk) => formData.set(chunk[0], chunk[1]));
  if (data.type === 'text') {
    formData.set('content', textArea.value);
    data.content = textArea.value;
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
      alert('MediaRecorder API is not active in your browser! If you\'re using iOS 12.1-14 you can enable this functionality in its settings (MediaRecorder). Then reload the page.');
      return null;
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
 * @param type
 * @param notesList
 * @param data
 * @param pipeBlob
 * @param masonry
 */
export function render(type, notesList, data, pipeBlob, masonry) {
  // Level 1 <li className="column notes-list-item">
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
  // Level 6 <i className="fa-solid fa-trash">
  const icon = document.createElement('i');
  // Level 3 <div className="card-content">
  const cardContent = document.createElement('div');
  cardContent.classList.add('card-content');
  // Level 4
  let notesListItemDescription;
  // Level 5
  let media;
  // Level 5
  let saveButton;
  // Level 5
  let startButton;
  // Level 5
  let input;

  if (['text', 'audio', 'video'].includes(type)) {
    notesListItem.classList.add('form');

    // Level 2 <form className="card">
    notesListItemWrapper = document.createElement('form');
    notesListItemWrapper.classList.add('card');
    notesListItemWrapper.name = uniqid();

    // Level 5 <input class="input" type="text" placeholder="Type the note's name">
    input = document.createElement('input');
    input.classList.add('input');
    input.type = type;
    input.name = 'nameField';
    input.required = true;
    input.placeholder = 'Type the note\'s name';
    cardHeaderTitle.append(input);

    deleteNote.classList.add('cancel');
    deleteNote.ariaLabel = 'cancel';

    icon.classList.add('fa-solid', 'fa-circle-xmark');
    // Level 4 <div className="content">
    notesListItemDescription = document.createElement('div');
    notesListItemDescription.classList.add('content');

    // Level 4 <div class="control">
    const control = document.createElement('div');
    control.classList.add('control');

    // Level 5 <button class="button save" type="submit">Save</button>
    saveButton = document.createElement('button');
    saveButton.classList.add('button', 'save');
    saveButton.type = 'button';
    saveButton.disabled = true;
    saveButton.textContent = 'Save';

    switch (type) {
      case 'text': {
        // Level 5 <textarea class="textarea" placeholder="Type the note's content">
        const textarea = document.createElement('textarea');
        textarea.classList.add('textarea', 'has-fixed-size');
        textarea.name = 'content';
        textarea.placeholder = 'Type the note\'s content';
        notesListItemDescription.append(textarea);
        break;
      }
      default: {
        // Level 5 <video/audio class="media">Your browser...</video/audio>
        media = document.createElement(`${type}`);
        media.classList.add('media');
        media.textContent = `Your browser does not support the &lt;code&gt;${type}&lt;/code&gt; element.`;
        notesListItemDescription.append(media);

        // Level 5 <button class="button start" type="button">Start</button>
        startButton = document.createElement('button');
        startButton.classList.add('button', 'start');
        startButton.type = 'button';
        startButton.textContent = 'Start';
        control.append(startButton);

        saveButton.classList.add('is-hidden');
        break;
      }
    }

    cardContent.insertAdjacentElement('beforeend', control).append(saveButton);
  } else {
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

    // New notes shouldn't be available to use before they are ready for it
    if (data.uploadComplete !== undefined) {
      cardContent.setAttribute('data-id', data.id);
      if (data.uploadComplete === false) {
        deleteNote.disabled = true;
        icon.style.color = '#aaaaaa';
        notesListItemDescription.textContent = 'File is uploading...';
        notesListItemDescription.disabled = true;
      } else {
        notesListItemDescription.classList.add('media-content');
        notesListItemDescription.textContent = 'Click to open the media!';
      }
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

  return {
    notesListItemWrapper,
    input,
    deleteNote,
    icon,
    notesListItemDescription,
    media,
    saveButton,
    startButton,
  };
}
