import Media from './media';
import { animateModals } from './utils';

export default class Preview {
  constructor(preview, fileId, fileType, fileUrl) {
    this.fileUrl = fileUrl;
    this.preview = preview;
    this.media = new Media(this.preview, 'preview', fileType);
    this.media.player.style.order = '1';
    if (this.media.player.classList.contains('hidden')) {
      this.media.player.classList.remove('hidden');
    }
    if (this.fileUrl !== 'media') {
      this.media.mediaElement.src = fileUrl;
    } else {
      this.media.mediaElement.prepend((() => {
        const source = document.createElement('source');
        source.setAttribute('src', `http://localhost:3001/chest-of-notes/mongo/fetch/one/${fileId}`);
        source.setAttribute('type', `${this.media.mediaElement.tagName.toLowerCase()}/mp4`);
        return source;
      })());
    }
    this.media.addMediaElementListeners(fileUrl);
    this.media.addPlayerListeners();
  }

  closeModal(background) {
    animateModals(this.preview, background, 'close');
    if (this.media) this.media.removeMedia();
  }
}
