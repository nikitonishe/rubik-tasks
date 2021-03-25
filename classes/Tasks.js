const path = require('path');
const Rubik = require('rubik-main');
const isString = require('lodash/isString');
const get = require('lodash/get');
const Task = require('./Task');

/**
 * Выполненяет задания с определенной периодичностью или в определенное время суток
 * @extends Rubik
 * @prop {String} name имя кубика, по умолчанию tasks
 * @prop {Array} tasks задания, которые нужно выполнять
 * @prop {Array} volumes пути до директорий с заданиями
 * @prop {Array} tasksBuffer буфер задач, сюда добавляются задачи пока кубик не будет поднят
 * @param {Array|String} volumes Путь или массив путей до директории с заданиями
 */
class Tasks extends Rubik.Kubik {
  constructor (volumes) {
    super();
    this.tasks = new Map();
    this.volumes = [];

    this.tasksBuffer = [];

    if (Array.isArray(volumes)) {
      this.volumes = volumes;
    } else if (isString(volumes)) {
      this.volumes.push(volumes);
    }

    this.isUpped = false;
  }

  /**
   * Запустить задачу на выполнение
   * @param  {Task} task задача
   * @return {Task} task
   */
  start(task) {
    task.start();
    return task;
  }

  /**
   * Остановить задачу по id
   * @param  {String} id идентификатор задачи
   * @return {Promise<Task>}
   */
  async stop(id) {
    const task = this.tasks.get(id + '');
    if (!task) return;
    await task.stop();
    return task;
  }

  /**
   * Остановить все задачи
   * @return {Promise}
   */
  async stopAll() {
    const promisses = [];
    this.tasks.forEach((task) => promisses.push(task.stop()));
    return Promise.all(promisses);
  }

  /**
   * Принять ошибку задачи
   * @param  {Error} err   ошибка
   * @param  {Task}  task  задача
   */
  async error(err, task) {
    this.log.error(err, `In task ${task.name || 'nameless task'}`);
    await this.processHooksAsync('task-error', err, task);
  }

  /**
   * Прочитать задачи из разделов
   * @return {Promise}
   */
  async readTasks() {
    for (const volume of this.volumes) {
      await Rubik.helpers.readdir(volume, (file) => {
        const task = require(path.join(volume, file));
        this.add(task);
      });
    }
  }

  /**
   * Добавить задачу
   * А также подтянуть настройки для нее, если они есть
   * @param {Object} task задача
   */
  add(task) {
    // Если приложение не поднято, сохраняем задачи в буфере, пока не получим конфигурацию
    if (!this.isUpped) {
      this.tasksBuffer.push(task);
      return null;
    }
    const config = this.config.get(this.name);
    const options = task.name ? get(config, `tasks.${task.name}`) : null;
    if (options) Object.assign(task, options);

    task = new Task(task, this, config.timezone);
    this.tasks.set(task.id, task);
    return task;
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
   * Поднять кубик
   * @param  {Object}  dependencies прописанные зависимости
   * @return {Promise}
   */
  async up(dependencies) {
    Object.assign(this, dependencies);

    await this.processHooksAsync('before');
    this.isUpped = true;

    this.tasksBuffer.forEach(this.add, this);
    this.tasksBuffer = [];

    await this.readTasks();
  }

  /**
   * Выполнить после подъема всех кубиков
   */
  async after() {
    this.tasks.forEach(this.start, this);
    await this.processHooksAsync('after');
  }

  /**
   * Выключить кубик и очистить таски
   * @return {Promise}
   */
  async down() {
    await this.stopAll();
    this.tasks = new Map();
    this.isUpped = false;
  }
}

Tasks.prototype.name = 'tasks';
Tasks.prototype.dependencies = Object.freeze(['log', 'config']);

Tasks.prototype.addTask = Tasks.prototype.add;
module.exports = Tasks;
