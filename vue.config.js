const WorkerPlugin = require("worker-plugin");
module.exports = {
  // 配置多页面
  pages: {
    index: "src/main.js",
    setting: "src/setting.js"
  },
  configureWebpack: {
    plugins: [new WorkerPlugin()],
    devtool: "source-map"
  },
  pluginOptions: {
    electronBuilder: {
      // List native deps here if they don't work
      externals: ["my-native-dep"],
      // If you are using Yarn Workspaces, you may have multiple node_modules folders
      // List them all here so that VCP Electron Builder can find them
      nodeModulesPath: ["../../node_modules", "./node_modules"],
      // seting background nodeIntegration
      nodeIntegration: true,
      preload: "src/preload.js",
      builderOptions: {
        productName: "WillPaper",
        appId: "com.wall.paper",
        publish: ["github"],
        dmg: {
          contents: [
            {
              x: 410,
              y: 150,
              type: "link",
              path: "/Applications"
            },
            {
              x: 130,
              y: 150,
              type: "file"
            }
          ]
        },
        mac: {
          icon: "./build/icons/icon.icns"
        },
        win: {
          //win相关配置
          icon: "./build/icons/icon.icns", //图标，当前图标在根目录下，注意这里有两个坑
          target: [
            {
              target: "nsis", //利用nsis制作安装程序
              arch: [
                "x64", //64位
                "ia32" //32位
              ]
            }
          ]
        },
        nsis: {
          oneClick: false, // 一键安装
          allowElevation: true, // 允许请求权限提升。如果为false，则用户必须使用提升的权限重新启动安装程序
          allowToChangeInstallationDirectory: true, // 允许修改安装路径
          perMachine: true, // 是否开启安装时权限限制(此电脑或当前用户)
          createDesktopShortcut: true, //创建桌面图标
          createStartMenuShortcut: true, // 创建开始菜单图标
          shortcutName: "Wall.Paper", // 图标名称
          //guid:"", // 注册表名 不推荐修改
          installerIcon: "./build/icons/icon.ico", // 安装图标
          uninstallerIcon: "./build/icons/icon.ico", // 卸载图标
          installerHeaderIcon: "./build/icons/icon.ico" // 安装时头部图标
        }
      }
    }
  },
  chainWebpack: config => {
    config.resolve.symlinks(true); // 修复热更新失效
  }
};
