export function formatTime(rawTime) {
  const time = Math.floor(rawTime);
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return (`${((hours < 10) && (hours > 0)) ? '0' : ''}${(hours > 0) ? `${hours}:` : ''}${(minutes < 10) ? '0' : ''}${minutes}:${(seconds < 10) ? '0' : ''}${seconds}`);
}

export function addMediaElement(type, rootElement) {
  const element = document.createElement(type);
  element.id = 'media';
  element.textContent = `Your browser does not support the <code>${type}</code> element.`;
  rootElement.after(element);
  return element;
}
