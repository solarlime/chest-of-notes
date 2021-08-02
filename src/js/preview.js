import Media from './media';
import { animateModals } from './utils';

export default class Preview {
  constructor(preview, fileType, fileUrl = null) {
    this.fileUrl = fileUrl;
    this.preview = preview;
    this.media = new Media(this.preview, 'preview', fileType);
    this.media.player.style.order = '1';
    this.media.mediaElement.src = fileUrl;
    this.media.addMediaElementListeners(fileUrl);
    this.media.addPlayerListeners();
  }

  closeModal(background) {
    animateModals(this.preview, background, 'close');
    if (this.media) this.media.removeMedia();
  }
}
