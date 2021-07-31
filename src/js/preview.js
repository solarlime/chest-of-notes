import Media from './media';

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
}
