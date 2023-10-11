/* eslint-disable no-param-reassign */
import Masonry from 'masonry-layout';
import Form from './form';
import { render, showMessage, subscribeOnNotifications } from './utils';

export default class Page {
  constructor(serverHost, store) {
    this.serverHost = serverHost;
    this.store = store;
    this.page = document.body;
    this.logo = this.page.querySelector('.logo');
    this.burger = this.page.querySelector('.navbar-burger');
    this.burgerMenu = this.page.querySelector('.navbar-menu');
    this.menuButton = this.page.querySelector('.menu-button');
    this.notesLoading = this.page.querySelector('.notes-loading');
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

    // Easter egg logic
    const animateIt = () => {
      console.log('wow');
      const easterEgg = this.page.querySelector('.name-easter-egg');
      easterEgg.classList.add('animate-it');
      const animationTimeout = setTimeout(() => {
        easterEgg.classList.remove('animate-it');
        clearTimeout(animationTimeout);
      }, 2000);
    };
    let firstTouch;

    ['mousedown', 'touchstart'].forEach((eventType) => {
      this.logo.addEventListener(eventType, (event) => {
        event.preventDefault();
        if (!firstTouch || (Date.now() - firstTouch >= 1000)) {
          firstTouch = Date.now();
        } else {
          animateIt();
          firstTouch = undefined;
        }
      });
    });


    const unsubscribe = this.store.subscribe(() => {
      const storeData = this.store.getState();
      console.log('store:', storeData);
      if (storeData.form > 0 || storeData.items.length > 0) {
        this.notesList.classList.remove('is-hidden');
        this.emptyList.classList.add('is-hidden');
      } else {
        this.notesList.classList.add('is-hidden');
        this.emptyList.classList.remove('is-hidden');
      }
      masonry.layout();
    });

    // Some logic to clear layout from notes
    const deleteFromInterface = (itemToDelete, dataId) => {
      masonry.remove(itemToDelete);
      this.store.setState((previous) => ({
        ...previous,
        items: previous.items.filter((item) => item.id !== dataId),
      }));
    };

    // Listener functions are initiated in a constructor and are given as callbacks
    this.deleteListener = async (event, dataId) => {
      try {
        await showMessage('delete', 'Are you sure?');
        try {
          const res = await fetch(`${this.serverHost}/chest-of-notes/mongo/delete/${dataId}`);
          const result = await res.json();
          console.log(result);
          if (result.status.includes('Error')) {
            await showMessage('error', `Cannot delete! Server response: ${result.data}`);
          }
          if (result.status === 'Deleted') {
            const itemToDelete = event.target.closest('.notes-list-item');
            deleteFromInterface(itemToDelete, dataId);
          }
        } catch (e) {
          console.error(e);
        }
      } catch (e) { /* do nothing */ }
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
        const timeout = setTimeout(() => { masonry.layout(); clearTimeout(timeout); }, 500);
      } else {
        close(opened);
        this.store.setState((previous) => ({ ...previous, opened: null }));
      }
    };

    const contentButtons = [this.textButton, this.audioButton, this.videoButton];
    const isSubscribed = await subscribeOnNotifications(this.serverHost, this.notesList);

    // At first, fetched notes must be rendered
    const fetchedData = this.store.getState().items;
    let deleteButtonsAndIcons;
    this.notesLoading.classList.add('is-hidden');
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
          deleteButton.addEventListener('click', (event) => this.deleteListener(event, note.id));
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
    }

    const disableAll = () => {
      contentButtons.forEach((button) => {
        button.disabled = true;
        button.parentElement.classList.add('hidden');
      });
      deleteButtonsAndIcons.forEach((buttonAndIcon) => {
        buttonAndIcon.button.disabled = true;
        buttonAndIcon.icon.style.color = '#aaaaaa';
      });
      this.burger.disabled = true;
      this.menuButton.disabled = true;
    };

    if (isSubscribed !== 'allow') {
      disableAll();
    } else {
      this.addEventListeners(masonry, contentButtons);
    }

    document.body.addEventListener('disable', disableAll);

    // A listener for deleting incomplete notes (see 'uploaderror' in utils.js)
    this.notesList.addEventListener('clearIncomplete', (event) => {
      const itemToDelete = this.notesList.querySelector(`[data-id="${event.detail.id}"]`).closest('li');
      deleteFromInterface(itemToDelete, event.detail.id);
    });
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

        this.store.setState((previous) => ({ ...previous, form: previous.form + 1 }));
        this.form = new Form(this.serverHost, this.notesList, this.store, masonry, button.name, this.deleteListener, this.previewListener);
      };
      button.addEventListener('click', listener);
    });
  }
}
