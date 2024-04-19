const path = require('path');
const rootPath = path.resolve(__dirname, '..');
const demoPath = `${rootPath}/demo`;
console.log('demoPath: ', demoPath);
const { spawn } = require('child_process')
module.exports = (api) => {
  // console.log('api: ', api);
  console.log('运行自定义插件');

  // 监听dumi是否启动
  api.onStart((res) => {
    console.log('==启动日报项目== ');
    // 关联vbtaro
    // 启动日报项目
    try {
      spawn('yarn', ['dev:h5'], {
        cwd: demoPath,
        stdio: 'inherit'
      });
    } catch (error) {
      console.log('error: ', error);
    }
  })
}
