import * as moment from 'moment';

export class Time {
  static seconds(second: number): number {
    return second * 1000;
  }

  static dateToTotalCentiSeconds(t: Date) {
    const time = moment(t).utc();
    return time.seconds() + time.minutes() * 60 + time.hours() * 360 + time.milliseconds() / 1000;
  }

  static formatDatetime(datetime: Date, format: string = 'HH:mm:ss.SSS') {
    return moment(datetime).utc().format(format);
  }

  static formatMilliseconds(milliseconds: number) {
    const hh = Time.pad(Math.floor(milliseconds / 3600000), 2);
    const mm = Time.pad(Math.floor(milliseconds / 3600000 / 60), 2);
    const ss = Time.pad(Math.floor(milliseconds / 3600000 % 60), 2);
    const SSS = Time.pad(Math.floor(milliseconds % 1000), 3);
    return `${hh}:${mm}:${ss}:${SSS}`;
  }

  private static pad(number: number, width: number, padChar: string = '0') {
    const n = '' + number;
    return n.length >= width ? n : new Array(width - n.length + 1).join(padChar) + n;
  }

}
