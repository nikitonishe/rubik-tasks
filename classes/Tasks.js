const path = require('path');
const Rubik = require('rubik-main');
const moment = require('moment-timezone');
const isString = require('lodash/isString');
const isFunction = require('lodash/isFunction');
const get = require('lodash/get');
const nanoid = require('nanoid');

const delay = require('./lib/delay');

const ALWAYS = true;

/**
 * Выполненяет задания с определенной периодичностью или в определенное время суток
 * @extends Rubik
 * @prop {String} name имя кубика, по умолчанию tasks
 * @prop {Array} tasks задания, которые нужно выполнять
 * @prop {Array} volumes пути до директорий с заданиями
 * @param {Array|String} volumes Путь или массив путей до директории с заданиями
 */
class Tasks extends Rubik.Kubik {
  constructor (volumes) {
    super();
    this.tasks = [];
    this.volumes = [];

    this.timers = {};

    if (Array.isArray(volumes)) {
      this.volumes = volumes;
    } else if (isString(volumes)) {
      this.volumes.push(volumes);
    }
  }

  /**
   * Выполнить функцию с аргументами
   * @param  {Function|Array} job функция, если передать массив, то выполнит задачи последовательно
   * @param  {Array}  args дополнительные аргументы для задач
   * @return {Promise}
   */
  async process(job, args = []) {
    if (isFunction(job)) {
      return job(...args, this, this.app);
    }

    if (Array.isArray(job)) {
      const jobs = job;
      for (const job of jobs) {
        await this.process(job, args);
      }
    }
  }

  /**
   * Запустить таск на выполнение
   * @param  {Object}  task
   * @return {Promise}
   */
  async start(task) {
    if (!(Array.isArray(task.jobs) || isFunction(task.jobs))) {
      return this.log.warn(
        `Task ${task.name || 'without name'} doesn't have valid jobs`
      );
    }


    while (ALWAYS) {
      try {
        let remainingTime;
        // Получаем время задачи в секундах
        if (task.time) remainingTime = this.getRemainingTime(task.time);
        // Если у задачи нет времени, но есть период, то запускаем его на выполнение
        else if (task.period) remainingTime = task.period;
        else {
          return this.log.warn(
            `Task ${task.name || 'without name'} doesn't have time or period value`
          );
        }

        this.log.info(`${remainingTime} before ${task.name}`);
        // Ожидаем до того момента, когда можно будет начать выполнять задачи
        await delay(remainingTime * 1000);

        // Получаем аргументы задачи
        const args = Array.isArray(task.arguments) ? task.arguments : [];

        await this.process(task.jobs, args);

      } catch (err) {
        this.log.error(err);
      }
      await delay(1000);
      if (task.oneTime) break;
    }
  }

  /**
   * Использовать расширение
   * @param  {Mixed} extension расширение
   */
  use(extension) {
    if (Array.isArray(extension.volumes)) {
      for (const volume of extension.volumes) {
        this.volumes.push(volume);
      }
      return;
    }
    super.use(extension);
  }



  /**
   * Прочитать задачи из разделов
   * @return {Promise}
   */
  async readTasks() {
    for (const volume of this.volumes) {
      await Rubik.helpers.readdir(volume, (file) => {
        const task = require(path.join(volume, file));
        this.addTask(task);
      });
    }
  }

  /**
   * Добавить задачу
   * А также подтянуть настройки для нее, если они есть
   * @param {Object} task задача
   */
  addTask (task) {
    const config = this.config.get(this.name);
    const settings = get(config, `${task.name}.settings`);
    if (settings) Object.assign(task, settings);
    this.tasks.push(task);
  }

  /**
   * Поднять кубик
   * @param  {Object}  dependencies прописанные зависимости
   * @return {Promise}
   */
  async up(dependencies) {
    Object.assign(this, dependencies);
    await this.processHooks('before');
    await this.readTasks();
  }

  /**
   * Выполнить после подъема всех кубиков
   */
  async after() {
    this.tasks.forEach(this.start, this);
    await this.processHooks('after');
  }

  /**
   * Выключить кубик
   * @return {Promise}
   */
  async down() {

  }
}

Tasks.prototype.name = 'tasks';
Tasks.prototype.dependencies = Object.freeze(['log', 'config']);
module.exports = Tasks;
