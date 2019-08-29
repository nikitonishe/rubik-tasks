/* global test describe expect jest */
const path = require('path');
const moment = require('moment-timezone');
const { createApp, createKubik } = require('rubik-main/tests/helpers/creators');
const { Kubiks: { Config, Log } } = require('rubik-main');
const Tasks = require('../classes/Tasks');
const Task = require('../classes/Task');

const delay = require('./lib/delay');

const COUNT_OF_TEST_TASKS = 4;

describe('Кубик Tasks', () => {
  test('Кубик создается нормально', async () => {
    const volumes = [path.join(__dirname, './'), path.join(__dirname, './lib/')];
    const tasksWithVolume = new Tasks(volumes[0]);
    const tasksWithVolumes = new Tasks(volumes);

    expect(tasksWithVolume.volumes.length).toBe(1);
    expect(tasksWithVolume.volumes.includes(volumes[0])).toBe(true);

    expect(tasksWithVolumes.volumes).toEqual(volumes);
  });

  test('Кубик подключается к Рубику и доступен по имени', () => {
    const app = createApp();
    const tasks = createKubik(Tasks, app);
    expect(app.get('tasks')).toBe(tasks);
  });

  test('Кубик прочитает все задачи с диска, когда поднимется', async () => {
    const app = createApp();
    app.add(new Config);
    app.add(new Log);
    const kubik = new Tasks([
      path.join(__dirname, './tasks/one/'),
      path.join(__dirname, './tasks/two/')
    ]);
    app.add(kubik);
    await app.up();
    expect(kubik.tasks.size).toBe(COUNT_OF_TEST_TASKS);
    await app.down();
  });

  test('Одноразовая задача выполнится только один раз', async () => {
    const app = createApp();
    app.add(new Config);
    app.add(new Log);
    const kubik = createKubik(Tasks, app);

    const mockCb1 = jest.fn();
    const mockCb2 = jest.fn();

    // Новый формат
    kubik.addTask({
      name: 'One-time task 1',
      period: 1,
      jobs: [mockCb1, mockCb1],
      once: true
    });

    // Старый формат
    kubik.addTask({
      name: 'One-time task 2',
      period: 2,
      func: [mockCb2, mockCb2, mockCb2],
      oneTime: true
    });

    await app.up();
    // Ждем 4 секунды, за это время должны были выполнится таски
    await delay(4000);

    expect(mockCb1.mock.calls.length).toBe(2);
    expect(mockCb2.mock.calls.length).toBe(3);

    await app.down();
  });

  test('Задача выполняется по времени', async () => {
    const app = createApp();
    const config = new Config([path.join(__dirname, '../default/')]);
    app.add(config);
    app.add(new Log);
    const kubik = createKubik(Tasks, app);

    await app.up();
    const timezone = config.get(kubik.name).timezone;

    const date = moment().tz(timezone);
    date.add(2, 'second');

    const time = date.format('HH:mm:ss');
    const mockCb = jest.fn();

    const task = kubik.addTask({
      name: 'Demo time task',
      description: 'Just another task',
      time,
      jobs: [mockCb]
    });

    task.start();

    // Ждем 3 секунды
    await delay(3000);

    expect(mockCb).toHaveBeenCalled();

    await app.down();
  });

  test('Задачу можно остановить', async () => {
    const parent = { log: { info: () => {} } };

    const cbMock = jest.fn();
    const task = new Task({
      period: 2,
      jobs: [cbMock]
    }, parent);



    await task.start();
    await task.stop();
    await delay(3000);

    expect(cbMock).not.toHaveBeenCalled();
  });
});
