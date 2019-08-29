const nanoid = require('nanoid');
const moment = require('moment-timezone');
const isFunction = require('lodash/isFunction');
const isString = require('lodash/isString');

const getTimeSeconds = require('../lib/getTimeSeconds');
const delay = require('../lib/delay');

const TaskError = require('../errors/TaskError');

const DEFAULT_TIMEZONE = 'Europe/Moscow';
const DAY_SECONDS = 24 * 60 * 60;

// DRY
/**
 * Бросить исключение неправильного поля jobs
 * @throws {TaskError} Jobs are not defined or invalid
 */
const invalidateJob = () => {
  throw new TaskError('Jobs are not defined or invalid');
}

/**
 * Объект описания задачи
 * @typedef {Object} RawTask
 * @prop {String}  id     идентификатор задачи
 * @prop {String}  [name] имя задачи
 * @prop {String}  [description] описание задачи
 * @prop {Array}   jobs   функции, которые нужно выполнить
 * @prop {Array}   func   тоже что и jobs, оставили для обратной совместимости
 * @prop {Number}  time   через сколько от начала суток нужно выполнить задачу
 * @prop {Number}  period через сколько секунд от запуска нужно выполнить задачу
 * @prop {Array}   arguments аргументы для функций задачи
 * @prop {Boolean} once      выполнить задачу один раз
 * @prop {Boolean} oneTime   тоже что и once, оставили для обратной совместимости
 */

/**
 * Задача на выполнение
 * @class Task
 * @prop {String}  id     идентификатор задачи
 * @prop {String}  [name] имя задачи
 * @prop {String}  [description] описание задачи
 * @prop {Tasks}   parent родительский класс для обслуживания задач
 * @prop {Array}   jobs   функции, которые нужно выполнить
 * @prop {Number}  time   через сколько от начала суток нужно выполнить задачу
 * @prop {Number}  period через сколько секунд от запуска нужно выполнить задачу
 * @prop {Array}   arguments аргументы для функций задачи
 * @prop {Boolean} once      выполнить задачу один раз
 * @prop {Mixed}   timeout   идентификатор таймаута задачи
 * @prop {Boolean} isStop    флаг показывает, ждет ли сейчас задача выключения
 * @prop {Promise} inProcess текущий промис выполнения, если что-то выполняется. Нужен для правной остановки кубика
 */
class Task {
  constructor({
    id, name, description, time, period, jobs, func, arguments: args, once, oneTime
  }, parent, timezone) {
    if (!id) id = nanoid();
    period = isString(period) ? +period : period;
    time = getTimeSeconds(time);

    this.id = id + '';
    this.name = name || null;
    this.description = description || null;

    this.parent = parent;

    // Проверяем время и период на корректность
    if (!(this.isTime(time) || this.isPeriod(period))) {
      throw new TaskError('Time and period of task are not defined or invalid');
    }

    // Проверяем функции на корректность
    if (!(jobs && (Array.isArray(jobs) || isFunction(jobs)) || Array.isArray(func))) {
      return invalidateJob();
    }

    // Если jobs — это функция, то обернем ее в массив
    if (isFunction(jobs)) jobs = [jobs];
    // А если jobs вообще нет (но есть func), сделаем его пустым массивом
    else if (!jobs) jobs = [];

    // Если у нас старый формат задач, то добавляем func к jobs
    if (Array.isArray(func)) jobs = jobs.concat(func);

    // Если нет фукнций, то нельзя создать такой таск
    if (!jobs.length) return invalidateJob();

    // Проверяем что все что находится в массиве jobs — это функции
    jobs.forEach((job) => {
      if (!isFunction(job)) return invalidateJob();
    });

    this.jobs = jobs;

    this.time = this.isTime(time) ? time : null;
    this.period = this.isPeriod(period) ? period : null;

    this.arguments = Array.isArray(args) ? args : [];

    this.once = !!(once || oneTime);
    this.timezone = timezone || DEFAULT_TIMEZONE;

    this.timeout = null;
    this.inProcess = null;

    this.isStop = false;

    this.run = this.run.bind(this);
  }

  isTime(time = this.time) {
    return time || time === 0;
  }

  isPeriod(period = this.period) {
    return period || period === 0;
  }

  /**
   * Выполнить функции задачи
   * Если произойдет ошибка уведомить родителя через метод .error(err, this)
   * @return {Promise}
   */
  async process() {
    try {
      for (const job of this.jobs) {
        await job(...this.arguments, this.parent, this.parent.app, this);
      }
    } catch (err) {
      this.parent.error(err, this);
    }
  }

  /**
   * Выполнить функции задачи
   * И перезапусить отсчет до следующего выполнения, если это необходимо
   * @return {Promise}
   */
  async run() {
    this.timeout = null;

    this.inProcess = this.process();
    await this.inProcess;
    this.inProcess = null;

    if (this.once) return;

    // Если задача построена на времени, то ждем одну секунду
    if (this.isTime()) {
      await delay(1000);
    }

    this.start();
  }

  /**
   * Начать выполнение задачи
   */
  start() {
    if (this.isStop) return;
    const secondsTo = this.isTime() ? this.getSecondsTo(this.time) : this.period;
    this.parent.log.info(`${secondsTo} seconds before ${this.name || 'nameless task'}`);
    this.timeout = setTimeout(this.run, secondsTo * 1000);
  }

  /**
   * Остановить выполнение задачи
   * @return {Promise}
   */
  async stop() {
    this.isStop = true;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    if (this.inProcess) await this.inProcess;
    this.isStop = false;
  }

  /**
   * Получить сколько осталось времени
   * @param  {String} time время разделенное двоеточием 12:00 например
   * @return {Number} сколько осталось секунд до выполнения задачи
   */
  getSecondsTo() {
    const date = moment().tz(this.timezone);
    const currentSeconds = getTimeSeconds([date.hours(), date.minutes(), date.seconds()]);
    return (DAY_SECONDS + this.time - currentSeconds) % (DAY_SECONDS);
  }
}

module.exports = Task;
