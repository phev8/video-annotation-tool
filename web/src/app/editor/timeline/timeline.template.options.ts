import { Time } from './time';
import * as moment from 'moment';
import { DataGroup } from 'vis';

export var options = {
  width: '100%',
  min: Time.seconds(0),
  start: Time.seconds(0),
  end: Time.seconds(15),
  max: Time.seconds(98), // todo
  moment: function (date) {
    return moment(date).utc();
  },
  format: {
    minorLabels: {
      millisecond: 'ss.SSS',
      second: 'HH:mm:ss',
      minute: 'HH:mm:ss',
      hour: 'HH:mm',
      weekday: 'HH:mm',
      day: 'HH:mm',
      week: 'HH:mm',
      month: 'HH:mm',
      year: 'HH:mm'
    },
    majorLabels: {
      second: 'HH:mm:ss',
      minute: 'HH:mm:ss',
      hour: '',
      weekday: '',
      day: '',
      week: '',
      month: '',
      year: ''
    }
  },
  groupTemplate: (group: DataGroup) => {
    if (group) {

      const overarchingContainer = document.createElement('div');
      overarchingContainer.className = 'clr-row top-margin';

      const containerLeft = document.createElement('div');
      containerLeft.className = 'clr-col-6';

      const containerRight = document.createElement('div');
      containerRight.className = 'clr-col-6';

      const categoryContainer = document.createElement('div');
      categoryContainer.className = 'btn btn-link';

      const categoryLabel = document.createElement('label');
      categoryLabel.innerHTML = group['category'];
      categoryLabel.addEventListener('click', () => {
        this.labelsService.addLabel(JSON.parse(localStorage.getItem('currentSession$'))['user']['id'],group['categoryId'], this.userRole);
      });

      categoryContainer.append(categoryLabel);

      const container = document.createElement('div');
      container.className = 'checkbox btn';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `checkbox_${group.id}`;
      input.addEventListener('change', () => {
        this.checkForTracking(group['categoryId']);
        this.checkboxChange.emit({id: group.id, checked: input.checked});
      });

      const label = document.createElement('label');
      label.setAttribute('style', 'padding-right: 2em;');
      label.setAttribute('for', `checkbox_${group.id}`);
      label.innerHTML = group.content;

      container.prepend(input);
      container.append(label);

      containerLeft.appendChild(categoryContainer);
      containerRight.appendChild(container);

      overarchingContainer.appendChild(containerLeft);
      overarchingContainer.appendChild(containerRight);
      return overarchingContainer;
    }
  },
  multiselect: true,
  editable: true,
  onAdd: (item, callback) => {
    console.log('onAdd', item);
    item.content = 'tracker';
    callback(item); // send back adjusted new item
  },
  onMove: (item, callback) => {
    console.log('onMove', item);
    callback(item);
  },
  onMoving: (item, callback) => {
    console.log('onMoving', item);
    callback(item);
  },
  onUpdate: (item, callback) => {
    console.log('onUpdate', item);
    callback(item);
  },
  onRemove: (item, callback) => {
    console.log('onRemove', item);
    callback(item);
  },
  tooltipOnItemUpdateTime: {
    template: item => {
      const fstart = Time.formatDatetime(item.start);
      const fend = Time.formatDatetime(item.end);
      return `Start: ${fstart}<br>End:${fend}`;
    }
  },
  tooltip: {
    followMouse: true,
    overflowMethod: 'cap'
  }
};
