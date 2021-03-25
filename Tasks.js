const Rubik = require('rubik-main');
const delay = require('./services/delay');
const moment = require('moment');
const lodash = require('lodash');

/**
 * Осуществляет выполнение заданий с определенной периодичностью или в определенное время суток
 * @extends Rubik
 */
class Tasks extends Rubik.Kubik {
  /**
   * Устанавливает зависимости и нициализирует tasks и volumes
   * @param {Array|String} volumes Путь или массив путей до папки с заданиями
   */
  constructor (volumes) {
    super();
    this.name = 'Tasks';
    this.dependencies = ['log', 'config'];
    this.tasks = [];
    this.volumes = [];

    // Чтобы функция не потеряла контекст когда сделаем this.tasks.map(this.timer)
    this.timer = this.timer.bind(this);

    if (Array.isArray(volumes)) {
      this.volumes = volumes;
    } else if (typeof volumes === 'string') {
      this.volumes.push(volumes);
    }
  }

  /**
   * Выполняет таск
   * @param  {Object}  task
   * @return {Promise}
   */
  async timer(task) {
    const always = true;
    while (always) {
      try {
        let remainingTime;

        if (task.off) return;
        if (task.time) remainingTime = this.getRemainingTime(task.time);
        if (task.period) remainingTime = task.period;

        this.log.info(`${remainingTime} до ${task.name}`);
        await delay(remainingTime * 1000);

        for (const functionToExecute of task.func) {
          await functionToExecute(this, this.app);
        }

      } catch (err) {
        console.error(err);
      }
      await delay(1000);
      if (task.oneTime) break;
    }
  }

  use(extension) {
    if (Array.isArray(extension.volumes)) {
      for (const volume of extension.volumes) {
        this.volumes.push(volume);
      }
    }
    super.use(extension);
  }

  getRemainingTime(time) {
    if (!time || !time.split) time = '0:0'; // Если время не было передано или его нельзя сплитить, берем по умолчанию значение '0:0'
    time = time.split(':'); // Получаем массив, в котором нулевой элемент — это часы, первый — минуты, третий — секунды (если они есть)
    const desiredSeconds = (+time[0] || 0) * 3600 + (+time[1] || 0) * 60 + (+time[2] || 0); // Вычисляем время запуска задания в секундах от начала суток
    const date = moment.utc().add(3, 'h'); // Получаем текущую дату во временной зоне +3
    const currentSeconds = date.hours() * 3600 + date.minutes() * 60 + date.seconds(); // Вычисляем сколько на данный момент прошло секунд от начала суток
    // Чтобы узнать сколько секунд нужно подождать до начала задания находим разницу desiredSeconds - currentSeconds
    // Но может получиться так, что текущее время больше время запуска, и тогда разница получится отрицательной
    // В таком случае нужно к этой разнице прибавить 24 часа чтобы получить количество секунд до следующего запуска
    // Но при такой логике если разница все таки положительна мы получаем количество секунд более суток, тогда просто берем остаток от деления на 24 часа
    return (24*3600 + desiredSeconds - currentSeconds) % (24 * 3600);
  }

  async readTasks() {
    const path = require('path');
    for (const volume of this.volumes) {
      await Rubik.helpers.readdir(volume, (file) => {
        const task = require(path.join(volume, file));
        this.addTask(task);
      });
    }
  }

  addTask (task) {
    const config = this.config.get('taskExecutor');
    const settings = lodash.get(config, `${task.name}.settings`);
    if (settings) Object.assign(task, settings);
    this.tasks.push(task);
  }

  async up(kubiks) {
    Object.assign(this, kubiks);
    await this.readTasks();
    this.tasks.map(this.timer);
  }
}

module.exports = Tasks;
