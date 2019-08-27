const nanoid = require('nanoid');
const moment = require('moment-timezone');
const isFunction = require('lodash/isFunction');

const getTimeArray = require('../lib/getTimeArray.js');

const TaskError = require('../errors/TaskError.js');

// DRY
const invalidateJob = () => {
  throw new TaskError('Jobs are not defined or invalid');
}

class Task {
  constructor({
    id, name, description, time, period, jobs, func, arguments: args, once, oneTime
  }, parent) {
    if (!id) id = nanoid();
    period = +period;
    time = getTimeArray(time);

    this.id = id;
    this.name = name || null;
    this.description = description || null;

    this.parent = parent;

    if (!(time || period || period === 0)) {
      throw new TaskError('Time and period of task are not defined or invalid');
    }

    if (!(jobs && (Array.isArray(jobs) || isFunction(jobs)))) {
      return invalidateJob();
    }

    if (isFunction(jobs)) jobs = [jobs];
    if (Array.isArray(func)) jobs = jobs.concat(func);

    jobs.forEach((job) => {
      if (!isFunction(job)) return invalidateJob();
    });

    this.jobs = jobs;

    this.time = time || null;
    this.period = period ? period : (period === 0 ? 0 : null);

    this.arguments = Array.isArray(args) ? args : [];

    this.once = !!(once || oneTime);

    this.timeout = null;

    this.run = this.run.bind(this);
  }

  async run() {
    this.timeout = null;

    try {
      for (const job of this.jobs) {
        await job(...this.arguments, this.parent, this.parent.app, this);
      }
    } catch (err) {
      this.parent.error(err, this);
    }

    if (this.once) return;
    this.start();
  }

  start() {
    const secondsTo = this.time ? this.getSecondsTo(this.time) : this.period;
    this.timeout = setTimeout(this.run, secondsTo);
  }

  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    return;
  }

  /**
   * Получить сколько осталось времени
   * @param  {String} time время разделенное двоеточием 12:00 например
   * @return {Number} сколько осталось секунд до выполнения задачи
   */
  getSecondsTo() {
    const time = this.time.split(':');
    const desiredSeconds = (+time[0] || 0) * 3600 + (+time[1] || 0) * 60 + (+time[2] || 0);
    const date = moment.utc().add(3, 'h');
    const currentSeconds = date.hours() * 3600 + date.minutes() * 60 + date.seconds();
    return (24 * 3600 + desiredSeconds - currentSeconds) % (24 * 3600);
  }
}

module.exports = Task;
