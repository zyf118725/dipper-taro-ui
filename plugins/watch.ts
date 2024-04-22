const path = require('path');
const fs = require('fs-extra');
const chokidar = require('chokidar');
const rootPath = path.resolve(__dirname, '..');
const dumiSrcPath = `${rootPath}/src`;
const demoPath = `${rootPath}/demo`;
const demoSrcPath = `${demoPath}/src`;
const { exec, spawn } = require('child_process');
const taroAppPagesJsonPath = `${demoSrcPath}/app.pages.json`;
const DEMO_DEV_PORT = 12345;
const DEMO_DEV_HOST = `http://localhost:${DEMO_DEV_PORT}`;
const DEMO_PROD_HOST = 'https://taro-ui.vobile.cn/demo';
let demo;

const isProd = () => process.env.NODE_ENV === 'production';

module.exports = (api) => {
  // console.log('api: ', api);
  console.log('运行自定义插件');

  // 监听dumi是否启动
  api.onStart((res) => {
    if (!demo) {
      demo = createDemo();
      demo.systemLink();
    }
    if (!isProd()) {
      console.log('==启动小程序项目== ');
      demo.start();
    }
  });
  api.registerTechStack(() => new TaroTechStack());
};

// 创建demo进程
function createDemo() {
  let taroProcess;
  let watcherProcess;

  const systemLink = () => {
    const rootProcess = spawn('yarn', ['link'], {
      cwd: rootPath,
      stdio: 'inherit',
    });
    rootProcess.on('exit', () => {
      spawn('yarn', ['link', 'dipper-taro-ui'], {
        cwd: demoPath,
        stdio: 'inherit',
      });
    });
  };

  const start = () => {
    console.log('start====');
    killPort(DEMO_DEV_PORT)
      .then(() => {
        tryStart();
      })
      .catch((error) => {
        console.error(`端口${DEMO_DEV_PORT}释放失败`);
        console.error(error);
      });
  };

  const stop = () => {
    if (taroProcess) {
      taroProcess.kill('SIGINT'); // 终止子进程
    }
  };

  const restart = () => {
    // 监听子进程的退出
    taroProcess.on('exit', start);
    stop();
  };

  const tryStart = () => {
    // 取消监听退出
    if (taroProcess) {
      taroProcess.off('exit', start);
    }
    if (watcherProcess) {
      watcherProcess.close();
    }
    // 启动子进程
    try {
      console.log('启动子进程');
      taroProcess = spawn('yarn', ['dev:h5'], {
        cwd: demoPath,
        stdio: 'inherit',
      });
      taroProcess = spawn('yarn', ['link dipper-taro-ui'], {
        cwd: demoPath,
        stdio: 'inherit',
      });
      watcherProcess = chokidar
        .watch(taroAppPagesJsonPath, {
          persistent: true,
          ignored: /(^|[/\\])\../, // 忽略点文件
        })
        .on('change', (path) => {
          console.log('监听文件变化==');
          console.log('path', path);
          restart();
        });
    } catch {
      stop();
    }
  };
  const getUrl = (fileAbsPath) => {
    const componentRouter = getComponentRouter(fileAbsPath);
    if (isProd()) {
      return `${DEMO_PROD_HOST}/#/${componentRouter}`;
    }
    return `${DEMO_DEV_HOST}/#/${componentRouter}`;
  };
  return {
    systemLink,
    start,
    stop,
    restart,
    getUrl,
  };
}

// 关闭端口对应的进程
function killPort(port) {
  return new Promise((resolve, reject) => {
    // 使用lsof命令查找占用指定端口的进程
    exec(`lsof -i tcp:${port}`, (error, stdout, stderr) => {
      if (error) {
        resolve();
        return;
      }
      if (stderr) {
        resolve();
        return;
      }

      const processes = stdout.split('\n').slice(1);
      if (processes.length === 0) {
        console.log(`端口${port}没有被占用`);
        resolve();
        return;
      }

      let processCount = processes.length;

      processes.forEach((process) => {
        const pid = process.split(/\s+/)[1];
        if (!pid) {
          processCount--;
          return;
        }
        // console.log(`占用${port}端口的进程PID: ${pid}`);

        // 使用kill命令终止占用指定端口的进程
        exec(`kill -9 ${pid}`, (error, stdout, stderr) => {
          if (error) {
            reject(`执行kill命令时出错: ${error.message}`);
            return;
          }
          if (stderr) {
            reject(`kill命令返回错误: ${stderr}`);
            return;
          }
          // console.log(`成功终止PID为${pid}的进程`);

          processCount--;
          if (processCount === 0) {
            resolve();
          }
        });
      });
    });
  });
}

class TaroTechStack {
  /**
   * 技术栈名称，确保唯一
   */
  name = 'taro';
  /**
   * 是否支持编译改节点，返回 true 的话才会调用后续方法
   */
  isSupported(node, lang) {
    return lang === 'tsx';
  }
  /**
   * 代码转换函数，返回值必须是 React 组件代码字符串
   * @note  https://github.com/umijs/dumi/tree/master/src/types.ts#L57
   */
  transformCode(raw, opts) {
    copyComponentToDemo(opts.fileAbsPath);
    return raw;
  }
  /**
   * 生成 demo 预览器的组件属性，在需要覆盖默认属性时使用
   * @note  https://github.com/umijs/dumi/tree/master/src/types.ts#L70
   */
  generatePreviewerProps(props, opts) {
    let previewerProps = { ...props, demoUrl: demo.getUrl(opts.fileAbsPath) };
    console.log('props: ', props);
    console.log('opts: ', opts);
    console.log('预览器的组件属性==: ', previewerProps);
    return { ...props, demoUrl: demo.getUrl(opts.fileAbsPath) };
  }
}

const getComponentRelativeDir = (fileAbsPath) => {
  // => /Users/qianwu/Documents/vbtaro-ui/src/Button/demo/demo1.tsx
  const [_, filename] = fileAbsPath.split(dumiSrcPath); // => /Button/demo/demo1.tsx
  const filenames = filename.split('/').filter((item) => !!item);
  const componentName = filenames[0];
  const pagePath = filenames[filenames.length - 1];
  const pageName = pagePath.split('.tsx')[0];
  const componentRelativeDir = `pages/${componentName}/${pageName}`;
  return componentRelativeDir;
};

const getComponentRouter = (fileAbsPath) => {
  return `${getComponentRelativeDir(fileAbsPath)}/index`;
};

const copyComponentToDemo = (fileAbsPath) => {
  console.log('复制组件');
  try {
    const componentRelativeDir = getComponentRelativeDir(fileAbsPath);
    const componentRouter = `${componentRelativeDir}/index`;
    const componentTargetDir = `${demoSrcPath}/${componentRelativeDir}`;
    const componentTargetFile = `${componentTargetDir}/index.tsx`;

    fs.ensureDirSync(demoSrcPath);
    fs.ensureFileSync(componentTargetFile);
    fs.copySync(fileAbsPath, componentTargetFile);
    fs.ensureFileSync(`${componentTargetDir}/index.config.ts`);

    const taroAppPagesJson = require(taroAppPagesJsonPath);
    if (!taroAppPagesJson.includes(componentRouter)) {
      taroAppPagesJson.push(componentRouter);
      fs.writeFileSync(
        taroAppPagesJsonPath,
        JSON.stringify(taroAppPagesJson),
        'utf8',
      );
    }
  } catch (err) {
    console.error(err);
  }
};
