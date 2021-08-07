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
    fileReader.readAsDataURL(new File([pipeBlob], `${id}.mp4`, { type: `${data.type}/mp4` }));

    await new Promise((resolve) => {
      fileReader.addEventListener('loadend', async () => {
        data.content = fileReader.result;
        await callback();
        resolve();
      });
    });
  };

  if (data.type === 'text') {
    data.content = modalFormTextArea.value;
    await send();
  } else {
    await fileSend(send);
  }
  return data;
}

export async function recordSomeMedia(media) {
  const tag = media.tagName.toLowerCase();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: (tag === 'video') });
  const mediaRecorder = new MediaRecorder(stream, { type: `${tag}/mp4` });
  const pipeline = [];
  mediaRecorder.start();
  if (tag === 'video') {
    media.srcObject = stream;
    media.muted = true;
    media.play();
  }
  return { mediaRecorder, pipeline };
}

export function renderNewNote(notesList, data) {
  const isText = (data.type === 'text') ? data.content : 'media';
  const notesListItem = document.createElement('li');
  notesListItem.classList.add('notes-list-item');
  notesListItem.innerHTML = `<input type="checkbox" id="${data.id}" class="checkbox">\n`
    + '                    <div class="notes-list-item-header-wrapper">\n'
    + `                    <h3 class="notes-list-item-header">${data.name}</h3>\n`
    + `                        <label class="spoiler ${(!data.content) ? 'hidden' : ''}" for="${data.id}">\n`
    + '                            <svg class="spoiler-svg" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 490.656 490.656" xml:space="preserve">\n'
    + '                                <g><g>\n'
    + '                                    <path d="M487.536,120.445c-4.16-4.16-10.923-4.16-15.083,0L245.339,347.581L18.203,120.467c-4.16-4.16-10.923-4.16-15.083,0    c-4.16,4.16-4.16,10.923,0,15.083l234.667,234.667c2.091,2.069,4.821,3.115,7.552,3.115s5.461-1.045,7.531-3.136l234.667-234.667    C491.696,131.368,491.696,124.605,487.536,120.445z"/>\n'
    + '                                </g></g>\n'
    + '                            </svg>\n'
    + '                        </label>\n'
    + '                    </div>\n'
    + `                    <p class="notes-list-item-description ${(!data.content) ? 'hidden' : ''}">${(isText !== 'media') ? isText : 'Click to open the media!'}</p>`;
  notesList.append(notesListItem);
  return { notesListItem, isText };
}
