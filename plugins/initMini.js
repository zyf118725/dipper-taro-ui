// 将src下的demo转移到demo下
const path = require('path');
const fs = require('fs-extra');
const rootPath = path.resolve(__dirname, '..');
const srcPath = rootPath + '/src';
const destPath = rootPath + '/demo';
const { initMiniByDumi } = require('./utils');

// 初始化生成小程序项目的页面和路由
initMiniByDumi();

/**
 * 测试：node监听文件变化
 */
function watchFile() {
  fs.watch(`${srcPath}/home/index.js`, (eventType, filename) => {
    console.log('检测文件是否变化: ', srcPath);
    console.log(`文件发生变动的类型是: ${eventType}`);
    if (filename) {
      console.log(`发生变动的文件是: ${filename}`);
    } else {
      console.log('文件名未提供');
    }
  });
}
