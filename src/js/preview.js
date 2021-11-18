import Media from './media';
import { animateModals } from './utils';

export default class Preview {
  /**
   * Calling a constructor makes a preview modal visible
   * & creates a new Media to control the audio/video
   * @param serverHost
   * @param preview
   * @param fileId
   * @param fileType
   * @param fileBlob
   */
  constructor(serverHost, preview, fileId, fileType, fileBlob) {
    this.fileBlob = fileBlob;
    this.preview = preview;
    this.media = new Media(this.preview, 'preview', fileType);
    this.media.player.style.order = '1';
    if (this.media.player.classList.contains('hidden')) {
      this.media.player.classList.remove('hidden');
    }
    if (this.fileBlob) {
      this.fileUrl = URL.createObjectURL(this.fileBlob);
      this.media.mediaElement.src = this.fileUrl;
    } else {
      this.media.mediaElement.prepend((() => {
        const source = document.createElement('source');
        this.fileUrl = `${serverHost}/chest-of-notes/mongo/fetch/one/${fileId}`;
        source.setAttribute('src', this.fileUrl);
        source.setAttribute('type', `${this.media.mediaElement.tagName.toLowerCase()}/mp4`);
        return source;
      })());
    }
    this.media.addMediaElementListeners(this.fileUrl);
    this.media.addPlayerListeners();
  }

  /**
   * A function for closing a preview modal
   * @param background
   */
  closeModal(background) {
    animateModals(this.preview, background, 'close');
    URL.revokeObjectURL(this.fileUrl);
    if (this.media) this.media.removeMedia();
  }
}
