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

export function renderNewNote(notesList, data) {
  const isText = (data.type === 'text') ? data.content : null;
  const notesListItem = document.createElement('li');
  notesListItem.classList.add('notes-list-item');
  notesListItem.innerHTML = `<input type="checkbox" id="${data.id}" class="checkbox">\n`
    + '                    <div class="notes-list-item-header-wrapper">\n'
    + `                    <h3 class="notes-list-item-header">${data.name}</h3>\n`
    + `                        <label class="spoiler" for="${data.id}">\n`
    + '                            <svg class="spoiler-svg" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 490.656 490.656" xml:space="preserve">\n'
    + '                                <g><g>\n'
    + '                                    <path d="M487.536,120.445c-4.16-4.16-10.923-4.16-15.083,0L245.339,347.581L18.203,120.467c-4.16-4.16-10.923-4.16-15.083,0    c-4.16,4.16-4.16,10.923,0,15.083l234.667,234.667c2.091,2.069,4.821,3.115,7.552,3.115s5.461-1.045,7.531-3.136l234.667-234.667    C491.696,131.368,491.696,124.605,487.536,120.445z"/>\n'
    + '                                </g></g>\n'
    + '                            </svg>\n'
    + '                        </label>\n'
    + '                    </div>\n'
    + `                    <p class="notes-list-item-description">${(isText) || 'Click to open the media!'}</p>`;
  notesList.append(notesListItem);
  return { notesListItem, isText };
}
