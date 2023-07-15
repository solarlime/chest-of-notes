/* eslint-disable no-param-reassign */
import Masonry from 'masonry-layout';
import Form from './form';
import { render, subscribeOnNotifications } from './utils';

export default class Page {
  constructor(serverHost, store) {
    this.serverHost = serverHost;
    this.store = store;
    this.page = document.body;
    this.burger = this.page.querySelector('.navbar-burger');
    this.burgerMenu = this.page.querySelector('.navbar-menu');
    this.menuButton = this.page.querySelector('.menu-button');
    this.emptyList = this.page.querySelector('.notes-empty-list');
    this.notesList = this.page.querySelector('.notes-list');
    this.audioButton = this.page.querySelector('button.audio-button');
    this.videoButton = this.page.querySelector('button.video-button');
    this.textButton = this.page.querySelector('button.text-button');
  }

  async init() {
    const masonry = new Masonry(this.notesList, {
      itemSelector: '.notes-list-item',
      columnWidth: '.notes-list-item',
    });

    const unsubscribe = this.store.subscribe(() => {
      console.log('store:', this.store.getState());
      masonry.layout();
      const timeout = setTimeout(() => { masonry.layout(); clearTimeout(timeout); }, 500);
    });

    // Listener functions are initiated in a constructor and are given as callbacks
    this.deleteListener = async (event, dataId) => {
      const res = await fetch(`${this.serverHost}/chest-of-notes/mongo/delete/${dataId}`);
      const result = await res.json();
      console.log(result);
      if (result.status.includes('Error')) {
        alert(`Cannot delete! Server response: ${result.data}`);
      }
      if (result.status === 'Deleted') {
        const itemToDelete = event.target.closest('.notes-list-item');
        masonry.remove(itemToDelete);
        this.store.setState((previous) => ({ ...previous, items: previous.items.filter((item) => item.id !== dataId) }));
      }
    };

    this.previewListener = (id, button, type, pipeBlob) => {
      const { opened } = this.store.getState();
      const close = (idToClose) => {
        const previousMediaContainer = this.notesList.querySelector(`[data-id="${idToClose}"]`);
        const previousDescription = previousMediaContainer.querySelector('.notes-list-item-description');
        const previousMedia = previousMediaContainer.querySelector('.media');
        previousMedia.remove();
        previousDescription.textContent = 'Click to open the media!';
      };

      if (opened !== id) {
        if (opened !== null) {
          close(opened);
        }
        button.textContent = 'Click to close the media!';
        const media = document.createElement(type);
        if (pipeBlob) {
          media.src = URL.createObjectURL(pipeBlob);
        } else {
          media.src = `${this.serverHost}/chest-of-notes/mongo/fetch/${id}`;
        }

        media.className = 'media';
        media.controls = true;
        media.style.width = '100%';
        media.style.borderRadius = '4px';
        button.insertAdjacentElement('afterend', media);
        this.store.setState((previous) => ({ ...previous, opened: id }));
      } else {
        close(opened);
        this.store.setState((previous) => ({ ...previous, opened: null }));
      }
    };

    const contentButtons = [this.textButton, this.audioButton, this.videoButton];
    const isSubscribed = await subscribeOnNotifications(this.serverHost, this.notesList);

    // At first, fetched notes must be rendered
    const fetchedData = this.store.getState().items;
    // const fetchedData = [];
    let deleteButtonsAndIcons;
    if (fetchedData.length) {
      this.notesList.classList.remove('is-hidden');
      deleteButtonsAndIcons = fetchedData.map((note) => {
        const { deleteNote: deleteButton, notesListItemDescription: previewButton, icon } = render(
          'note',
          this.notesList,
          note,
          null,
          masonry,
        );
        if (isSubscribed === 'allow') {
          deleteButton.addEventListener('click', (event) => this.deleteListener(event, note.id), { once: true });
        }
        if (previewButton instanceof HTMLButtonElement) {
          previewButton.addEventListener('click', () => this.previewListener(note.id, previewButton, note.type, null));
        }
        return { button: deleteButton, icon };
      });
      masonry.layout();
      const timeout = setTimeout(() => { masonry.layout(); clearTimeout(timeout); }, 500);
    } else {
      this.emptyList.classList.remove('is-hidden');
      // this.notesList.hidden = false;
    }

    if (isSubscribed !== 'allow') {
      contentButtons.forEach((button) => {
        button.disabled = true;
        button.parentElement.classList.add('hidden');
      });
      deleteButtonsAndIcons.forEach((buttonAndIcon) => {
        buttonAndIcon.button.disabled = true;
        buttonAndIcon.icon.style.color = '#aaaaaa';
      });
    } else {
      this.addEventListeners(masonry, contentButtons);
    }
    deleteButtonsAndIcons = null;
  }

  addEventListeners(masonry, contentButtons) {
    /**
     * A listener for showing adding options (desktop)
     */
    this.menuButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.target.parentElement.classList.toggle('is-active');
    });

    /**
     * A listener for showing adding options (mobile)
     */
    this.burger.addEventListener('click', (event) => {
      event.preventDefault();
      this.burger.classList.toggle('is-active');
      this.burgerMenu.classList.toggle('is-active');
    });

    /**
     * A listener to open the content modal
     */
    contentButtons.forEach((button) => {
      // Make a listener for each button
      const listener = (event) => {
        event.preventDefault();
        [this.burger, this.menuButton].forEach((btn) => {
          if (btn.classList.contains('is-active') || (btn.parentElement.classList.contains('is-active'))) {
            btn.dispatchEvent(new Event('click'));
          }
        });

        this.form = new Form(this.serverHost, this.notesList, this.store, masonry, button.name, this.deleteListener, this.previewListener);
      };
      button.addEventListener('click', listener);
    });
  }
}
