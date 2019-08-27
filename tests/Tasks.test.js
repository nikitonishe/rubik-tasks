/* global test, describe, expect */
const path = require('path');
const { createApp, createKubik } = require('rubik-main/tests/helpers/creators.js');
const { Kubiks: { Config, Log } } = require('rubik-main');
const Tasks = require('./Tasks.js');

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
      path.join(__dirname, './tests/tasks/one/'),
      path.join(__dirname, './tests/tasks/two/')
    ]);
    app.add(kubik);
    await app.up();
    expect(kubik.tasks.length).toBe(COUNT_OF_TEST_TASKS);
    await app.down();
  });

  test('Одноразовая задача выполнится только один раз', () => {});

  test('Задачу можно остановить', () => {});
});
