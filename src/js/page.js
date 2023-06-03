/* eslint-disable no-param-reassign */
import Masonry from 'masonry-layout';
import Modal from './modal';
import Preview from './preview';
import { animateModals, renderNewNote } from './utils';

export default class Page {
  constructor(serverHost, fetchedData) {
    this.serverHost = serverHost;
    this.fetchedData = fetchedData;
    this.page = document.body;
    this.add = this.page.querySelector('.add');
    this.notes = this.page.querySelector('.notes');
    this.emptyList = this.page.querySelector('.notes-empty-list');
    this.notesList = this.page.querySelector('.notes-list');
    this.addButton = this.page.querySelector('button.notes-go-to-add-button');
    this.backButton = this.page.querySelector('button.back-button');
    this.audioButton = this.page.querySelector('button.audio-button');
    this.videoButton = this.page.querySelector('button.video-button');
    this.textButton = this.page.querySelector('button.text-button');
    this.background = this.page.querySelectorAll('section, footer');

    const masonry = new Masonry(this.notesList, {
      gutter: 10,
      itemSelector: '.notes-list-item',
      percentPosition: true,
      columnWidth: '.notes-list-item',
    });

    this.modal = new Modal(this.page, masonry);
    this.footerLogo = this.page.querySelector('.footer-logo');
    this.about = this.page.querySelector('.about');

    // At first, it is needed to subscribe on server notifications
    // Without this feature, the app freezes when a big file is sent
    const eventSource = new EventSource(`${this.serverHost}/chest-of-notes/notifications`, { withCredentials: true });

    eventSource.addEventListener('open', () => { console.log('Subscribing on notifications...'); });
    eventSource.addEventListener('deny', () => {
      const message = 'Server denied to subscribe on notifications: somebody has already connected';
      console.log(message);
      eventSource.close();
      [this.textButton, this.audioButton, this.videoButton].forEach((button) => {
        button.disabled = true;
        button.parentElement.classList.add('hidden');
      });
      this.notesList.querySelectorAll('.delete-note').forEach((deleteButton) => {
        deleteButton.disabled = true;
        deleteButton.querySelector('svg').style.fill = '#aaaaaa';
      });
      setTimeout(() => { alert(message); }, 500);
    });
    eventSource.addEventListener('error', () => { console.log('An error occurred with a notifications\' subscription'); });
    eventSource.addEventListener('uploaderror', (event) => {
      const message = `An error occurred with a file from the note "${event.data}". Try to record it again`;
      console.log(message);
      alert(message);
    });
    eventSource.addEventListener('uploadsuccess', (event) => {
      console.log(`Successfully saved a file from the note "${event.data}"!`);
      const descriptionToEdit = this.notes.querySelector(`#${event.lastEventId} ~ .notes-list-item-description`);
      const deleteNote = this.notes.querySelector(`#${event.lastEventId} ~ .notes-list-item-header-wrapper .delete-note`);
      deleteNote.querySelector('svg').style.fill = '';
      deleteNote.disabled = false;
      descriptionToEdit.textContent = 'Click to open the media!';
      descriptionToEdit.classList.add('media-content');
      descriptionToEdit.disabled = false;
    });

    // Listener functions are initiated in a constructor and are given as callbacks
    this.deleteListener = async (dataId) => {
      const res = await fetch(`${this.serverHost}/chest-of-notes/mongo/delete/${dataId}`);
      const result = await res.json();
      console.log(result);
      if (result.status.includes('Error')) {
        alert(`Cannot delete! Server response: ${result.data}`);
      }
      if (result.status === 'Deleted') {
        const itemToDelete = this.notesList.querySelector(`.notes-list-item #${result.data}`).parentElement;
        itemToDelete.remove();
        masonry.layout();
      }
      if (!this.notesList.children.length) {
        [this.emptyList, this.notesList].forEach((item) => item.classList.toggle('hidden'));
        this.emptyList.style.visibility = 'visible';
      }
    };

    this.previewListener = (dataType, dataContent, dataId) => {
      const previewWrapper = this.page.querySelector('.preview');
      const preview = new Preview(this.serverHost, previewWrapper, dataId, dataType, dataContent);
      animateModals(previewWrapper, this.background, 'open');

      const closeListener = (event) => {
        if (event.target.classList.contains('preview')) {
          preview.closeModal(this.background);
          previewWrapper.removeEventListener('click', closeListener);
        }
      };
      previewWrapper.addEventListener('click', closeListener);
      // A way to close without a mouse
      previewWrapper.addEventListener('keyup', (event) => {
        if (event.key === 'Escape') {
          previewWrapper.dispatchEvent(new Event('click'));
        }
      }, { once: true });
    };

    // At first, fetched notes must be rendered
    if (this.fetchedData.length) {
      [this.emptyList, this.notesList].forEach((item) => item.classList.toggle('hidden'));
      this.fetchedData.forEach((note) => {
        renderNewNote(
          this.notesList,
          note,
          null,
          this.deleteListener,
          this.previewListener,
          masonry,
        );
      });
      masonry.layout();
    } else {
      this.emptyList.style.visibility = 'visible';
    }

    // Then, add functionality to spoilers
    this.page.addEventListener('click', (event) => {
      if (event.target.classList.contains('checkbox')) {
        const spoiler = event.target;
        const description = spoiler.closest('li').querySelector('.notes-list-item-description');
        if (!event.isTrusted && !event.fromKeyboard) {
          spoiler.checked = false;
        }
        if (spoiler.checked) {
          description.style.maxHeight = `${description.scrollHeight}px`;
          Array.from(this.page.querySelectorAll('.checkbox'))
            .filter((item) => item.checked && item !== spoiler)
            .forEach((item) => { item.dispatchEvent(new Event('click', { bubbles: true })); });
        } else {
          description.style.maxHeight = '';
        }
        const timeout = setTimeout(() => { masonry.layout(); clearTimeout(timeout); }, 600);
      }
    });

    // Expanded notes should adapt if layout changes
    window.addEventListener('resize', () => {
      const timeout = setTimeout(() => {
        Array.from(this.page.querySelectorAll('.checkbox'))
          .filter((spoiler) => spoiler.checked)
          .forEach((spoiler) => {
            const description = spoiler.closest('li').querySelector('.notes-list-item-description');
            description.style.maxHeight = `${description.scrollHeight}px`;
          });
        masonry.layout();
        clearTimeout(timeout);
      }, 1000);
    });

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
     * A listener to open the content modal
     */
    const contentButtons = [this.audioButton, this.videoButton, this.textButton];
    contentButtons.forEach((button) => {
      // Make a listener for each button
      const listener = (event) => {
        event.preventDefault();
        // Resolve a modal view according to a clicked button
        // eslint-disable-next-line max-len
        const { modalAdd, type } = this.modal.openModal(this.serverHost, button, contentButtons, this.deleteListener, this.previewListener);
        animateModals(modalAdd, this.background, 'open');
        if (type !== 'text') {
          this.modal.addModalButtonListeners();
        }
      };
      button.addEventListener('click', listener);
    });
  }
}
