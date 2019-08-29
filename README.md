# Task executor for Rubik
Runs tasks delayed in time in Rubik's app.

# Install
Via Yarn:
```sh
yarn add rubik-tasks
```
or NPM:
```sh
npm install rubik-tasks
```

# Use
1. Connect it to an app. Config and Log kubiks are required:
```js
const path = require('path');
const { App, Kubiks } = require('rubik-main');
const Tasks = require('rubik-tasks');

const app = new App();
app.add([
  new Kubiks.Config(path.join(__dirname, './default/')),
  new Kubiks.Log,
  new Tasks(path.join(__dirname, './tasks/'))
]);

app.up().
then(() => {
  app.log.info('App is up');
}).
catch((err) => {
  app.log.error('App is down');
  app.log.error(err);
})
```

2. Create `tasks` folder, and tasks within it
`tasks/myFirstTask.js`
```js
module.exports = {
  name: 'My first task',
  description: 'Just push message to logs time by time',
  time: '10:00',
  jobs: [function(tasks, app, task) {
    app.log.info('The texty text from', task.name);
  }]
};
```

Now when the application ups, the task ”My first“ task will be queued for execution at 10am.

## Task options
- `id` is an id of the task, it is not required, and used to manually stop the task;
- `name` is a name of the task, it is not required;
- `description` is a description of the task, it is not required;
- `time` is a time of day, when the task should be started. Format is HH:mm;
- `period` is the frequency in seconds when the task will be executed;
- `jobs` is an array of functions, they are called one after another when the task is executed;
- `arguments` is an array of additional variables for task's functions, they are they are placed at the beginning of the function arguments;
- `once` is a flag to start task once.

## Manualy add tasks
Just use `add` method:
```js
tasks.add(task);
````
If you added a task before upping the app, then you no longer need to do anything.

If app is upped, you should start task manually:
```js
const task = tasks.add(rawTask);
tasks.start(task);
```

## Stop task
Just use `stop` method:
```js
tasks.stop(taskId);
```
