/**
 * @Description: 下载图片并存到指定文件夹
 * @Author: --
 */
const fs = require("fs");
const path = require("path");
const request = require("request");
const webp = require("webp-converter");
import store from "../electron-store";

/**
 * @type {Object} 保存当前的请求对象
 */
let myRequest = null;
let currentSaveFilePath = "";

/**
 * 创建指定路径文件
 * @param {String} dirname
 */
export function mkdirSync(dirname) {
  try {
    if (fs.existsSync(dirname)) {
      return true;
    }
    if (mkdirSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * 从指定连接下图片
 * @param {*} src 下载图片的绝对地址
 * @param {*} sendData  发送消息
 * @param {Object} userConfig 用户配置
 */
export const downloadPic = async function(src, cb) {
  return new Promise((resolve, reject) => {
    // 创建文件夹
    const hostdir = store.get("dowload-path");
    // 文件名
    const fileName = src;
    mkdirSync(hostdir);
    // const obj = JSON.parse(
    //   '{"' +
    //     decodeURI(fileName)
    //       .replace(/"/g, '\\"')
    //       .replace(/&/g, '","')
    //       .replace(/=/g, '":"') +
    //     '"}'
    // );
    // console.log(obj)
    const psp = fileName.split("/");
    let lasname = psp[psp.length - 1];
    lasname = lasname.split("wallhaven").join("wallpaper");
    const platfromPath = process.platform !== "darwin" ? "\\" : "/";
    let dstpath = `${hostdir}${platfromPath}${lasname}`;
    let isWebp = false;
    // 如图图片已经下载完成了
    if (fs.existsSync(`${dstpath}`)) {
      resolve(`${dstpath}`);
      return;
    }
    currentSaveFilePath = dstpath;
    let receivedBytes = 0;
    let totalBytes = 0;
    const writeStream = fs.createWriteStream(dstpath, {
      autoClose: true
    });
    myRequest = request({
      url: src,
      timeout: 120000 // 120s
    });
    myRequest.pipe(writeStream);
    myRequest.on("response", data => {
      // 更新总文件字节大小
      totalBytes = parseInt(data.headers["content-length"], 10);
      cb({ total: totalBytes });
    });
    myRequest.on("data", chunk => {
      // 更新下载的文件块字节大小
      receivedBytes += chunk.length;
      if (cb) cb({ current: receivedBytes });
    });

    myRequest.on("error", err => {
      deleteDownLoadFile(dstpath);
      reject(err);
    });
    writeStream.on("finish", () => {
      writeStream.end();
      myRequest = null;
      if (receivedBytes === totalBytes) {
        if (isWebp) {
          webp.dwebp(dstpath, dstpath.replace("webp", "jpg"), "-o", status => {
            // status 101->fails || 100->successful
            if (status === "100") {
              deleteDownLoadFile(dstpath);
              resolve(dstpath.replace("webp", "jpg"));
            } else {
              reject("设置失败，请稍后重试！");
            }
          });
        } else {
          resolve(dstpath);
        }
      } else {
        deleteDownLoadFile(dstpath);
        reject("操作成功！");
      }
    });
  });
};

/**
 * 取消下载
 */
export const cancelDownloadPic = function() {
  return new Promise(resolve => {
    if (myRequest) {
      myRequest.abort();
      deleteDownLoadFile(currentSaveFilePath);
    }
    resolve();
  });
};

function deleteDownLoadFile(filePath) {
  try {
    // 取消下载的时候删除图片
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, err => {
        if (err) {
          console.log("图片已删除");
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}
