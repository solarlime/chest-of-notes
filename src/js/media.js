/* eslint-disable no-param-reassign */
import getBlobDuration from 'get-blob-duration';
import { formatTime } from './utils';

export default class Media {
  constructor(wrapper, type, mediaType) {
    this.player = wrapper.querySelector(`.${type}-player`);
    this.play = wrapper.querySelector(`button.${type}-player-play`);
    this.pause = wrapper.querySelector(`button.${type}-player-pause`);
    this.back = wrapper.querySelector(`button.${type}-player-back`);
    this.forward = wrapper.querySelector(`button.${type}-player-forward`);
    this.time = wrapper.querySelector(`.${type}-player-time`);
    this.duration = wrapper.querySelector(`.${type}-player-duration`);

    this.mediaElement = this.addMediaElement(type, mediaType);
  }

  /**
   * A function for adding a media element
   */
  addMediaElement(type, mediaType) {
    const element = document.createElement(mediaType);
    element.id = `${type}-media`;
    element.textContent = `Your browser does not support the <code>${mediaType}</code> element.`;
    this.player.after(element);
    return element;
  }

  /**
   * A function for adding listeners to player buttons
   */
  addPlayerListeners() {
    const play = async () => {
      try {
        if (this.mediaElement.muted) {
          this.mediaElement.muted = false;
        }
        await this.mediaElement.play();
        this.play.classList.add('hidden');
        this.pause.classList.remove('hidden');
      } catch (e) {
        console.log('Playing error: ', e.message);
      }
    };
    const pause = async () => {
      try {
        await this.mediaElement.pause();
        this.pause.classList.add('hidden');
        this.play.classList.remove('hidden');
      } catch (e) {
        console.log('Pausing error: ', e.message);
      }
    };
    const back = () => {
      if (this.mediaElement.currentTime > 5) {
        this.mediaElement.currentTime -= 5;
      } else {
        this.mediaElement.currentTime = 0;
      }
    };
    const forward = () => {
      if (this.mediaElement.currentTime < this.mediaElement.duration - 5) {
        this.mediaElement.currentTime += 5;
      } else {
        this.mediaElement.currentTime = this.mediaElement.duration;
        this.pause.classList.add('hidden');
        this.play.classList.remove('hidden');
      }
    };

    this.play.addEventListener('click', play);
    this.pause.addEventListener('click', pause);
    this.back.addEventListener('click', back);
    this.forward.addEventListener('click', forward);

    this.mediaElement.addEventListener('play', play);
    this.mediaElement.addEventListener('pause', pause);

    this.listenerFunctions = [play, pause, back, forward];
  }

  /**
   * A function for adding listeners to a media element
   */
  addMediaElementListeners(fileUrl) {
    const loadedmetadata = () => {
      // A bugfix for Chromium: it can't get the duration
      if (this.mediaElement.duration === Infinity) {
        (async () => {
          const duration = await getBlobDuration(fileUrl);
          this.duration.textContent = formatTime(parseInt(duration, 10));
        })();
      } else {
        this.duration.textContent = formatTime(parseInt(this.mediaElement.duration, 10));
      }
      if (this.player.classList.contains('hidden')) {
        this.player.classList.remove('hidden');
      }
    };
    const timeupdate = () => {
      if (this.duration.textContent !== '00:00') {
        const time = formatTime(parseInt(this.mediaElement.currentTime, 10));
        if (this.time.textContent !== `${time} `) this.time.textContent = `${time} `;
      }
    };
    const ended = () => {
      this.pause.classList.add('hidden');
      this.play.classList.remove('hidden');
    };
    this.mediaElement.addEventListener('loadedmetadata', loadedmetadata);
    this.mediaElement.addEventListener('timeupdate', timeupdate);
    this.mediaElement.addEventListener('ended', ended);
  }

  removeMedia() {
    // Pause, if the media was playing
    this.pause.dispatchEvent(new Event('click'));
    // Remove player's listeners
    if (this.listenerFunctions) {
      [this.play, this.pause, this.back, this.forward]
        .forEach((element, i) => element.removeEventListener('click', this.listenerFunctions[i]));
      ['play', 'pause'].forEach((evt, i) => this.mediaElement.removeEventListener(evt, this.listenerFunctions[i]));
    }
    this.listenerFunctions = null;
    // Remove the media element
    if (this.mediaElement) {
      URL.revokeObjectURL(this.mediaElement.src);
      this.mediaElement.remove();
      this.mediaElement = null;
      this.time.textContent = '00:00';
      this.duration.textContent = '00:00';
      this.player.classList.add('hidden');
    }
  }
}
