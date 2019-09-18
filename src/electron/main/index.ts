import { app, BrowserWindow, ipcMain } from 'electron';
import { EventsEnum } from '../../utils/constant';
import { WindowPool } from './window-pool';

const debugMode = !!process.env.DEBUG_MODE;
const concurrency = Number(process.env.CONCURRENCY);

// 所有窗口关闭，则整个退出
app.on('window-all-closed', () => {
  app.quit();
});

app.on('ready', () => {
  // 新建 window pool 实例
  const windowPool = new WindowPool(concurrency, debugMode);

  // 转发测试数据，转发测试结果
  process.on(EventsEnum.ProcMessage, ({ test, id, type }) => {
    if (type === EventsEnum.ProcRunTest) {
      // 发送到 render 中执行单测
      windowPool.runTest(id, test).then(({ result, id }) => {
        process.send({ result, id, type: EventsEnum.ProcRunTestResult });
      });
    } else if (EventsEnum.ProcInitialWin) {
      windowPool.clearSaveTests();
      process.send({ type: EventsEnum.ProcInitialWinEnd });
    } else {
      console.error('Invalid message type', type);
    }
  });

  // electron proc ready
  process.send({ type: EventsEnum.ProcReady });
});
