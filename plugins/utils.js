const fs = require('fs-extra');
const path = require('path');
const rootPath = path.resolve(__dirname, '..');
const srcPath = rootPath + '/src';
const destPath = rootPath + '/demo';
const srcDemo = (item) => `${srcPath}/${item}/demo`;

/**
 * 初始化生成小程序项目的页面和路由
 * 注意：只有在第一次项目初始化或者要重置小程序项目时才启动, 会扫描src下所有文件夹
 */
function initMiniByDumi() {
  try {
    // 小程序的目标文件夹
    const miniPagesDir = `${destPath}/src/pages`;

    // 1. 先删除dest旧文件夹再新建文件夹
    if (fs.existsSync(miniPagesDir))
      fs.rmSync(miniPagesDir, { recursive: true });
    fs.mkdirsSync(miniPagesDir);

    // 2. 复制dumi下的demo
    const srcDemo = (item) => `${srcPath}/${item}/demo`;
    const temparr = fs
      .readdirSync(srcPath)
      .filter((item) => fs.existsSync(srcDemo(item)));
    temparr.forEach((item) => {
      fs.copySync(srcDemo(item), `${destPath}/src/pages/${item}`);
    });

    // 3. 生成路由文件
    const routes = createRoutes(temparr);
    fs.writeFileSync(
      `${destPath}/src/app.pages.json`,
      JSON.stringify(routes),
      'utf8',
    );
  } catch (error) {
    console.log('error: ', error);
  }
}

// 生成小程序路由
function createRoutes(list) {
  // 获取有效的全路径
  const resArr = [];
  list.forEach((item) => {
    const fullPath = `${srcDemo(item)}`;
    console.log('fullPath: ', fullPath);
    if (!fs.existsSync(fullPath)) return;
    if (fs.statSync(fullPath).isDirectory()) resArr.push(fullPath);
  });
  let routes = [];
  console.log('resArr: ', resArr);
  resArr.forEach((item) => {
    routes = [...routes, ...fullPathToRoutes(getFileInFolder(item))];
  });
  return routes;
}

function getFileInFolder(folder) {
  let pathlist = [];
  let allFiles = fs.readdirSync(folder);
  allFiles.forEach((item) => {
    const fullPath = `${folder}/${item}`;
    const isDir = fs.statSync(fullPath).isDirectory();
    if (isDir) {
      pathlist = [...pathlist, ...getFileInFolder(fullPath)];
    } else {
      pathlist.push(fullPath);
    }
  });
  return pathlist;
}

function fullPathToRoutes(list) {
  if (!Array.isArray(list)) return;
  const res = [];
  list.forEach((item) => {
    const arr = ('pages' + item.split('/src')[1].split('demo/').join('')).split(
      '.',
    );
    if (arr[1] === 'tsx' || arr[1] === 'jsx') res.push(arr[0]);
  });
  return res;
}

module.exports = {
  initMiniByDumi,
};
