/**
 * @Description: 下载图片并存到指定文件夹
 * @Author: --
 */
const fs = require("fs");
const path = require("path");
const request = require("request");
const webp = require("webp-converter");
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
    const hostdir = `${require("os").homedir()}${
      process.platform !== "darwin" ? "\\Downloads" : "/Downloads"
    }`;
    // 文件名
    const fileName = src;
    mkdirSync(hostdir);
    const splita = fileName.split("/");
    let dstpath = `${hostdir}/${splita[splita.length - 1]}`;
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
      autoClose: true,
    });
    myRequest = request({
      url: src,
      timeout: 120000, // 120s
    });
    myRequest.pipe(writeStream);
    myRequest.on("response", (data) => {
      // 更新总文件字节大小
      totalBytes = parseInt(data.headers["content-length"], 10);
    });
    myRequest.on("data", (chunk) => {
      // 更新下载的文件块字节大小
      receivedBytes += chunk.length;
      // console.log(receivedBytes, totalBytes)
      if (cb) cb();
    });

    myRequest.on("error", () => {
      deleteDownLoadFile(dstpath);
      reject();
    });
    writeStream.on("finish", () => {
      writeStream.end();
      myRequest = null;
      if (receivedBytes === totalBytes) {
        if (isWebp) {
          webp.dwebp(
            dstpath,
            dstpath.replace("webp", "jpg"),
            "-o",
            (status) => {
              // status 101->fails || 100->successful
              if (status === "100") {
                deleteDownLoadFile(dstpath);
                resolve(dstpath.replace("webp", "jpg"));
              } else {
                reject();
              }
            }
          );
        } else {
          resolve(dstpath);
        }
      } else {
        deleteDownLoadFile(dstpath);
        reject();
      }
    });
  });
};

/**
 * 取消下载
 */
export const cancelDownloadPic = function() {
  return new Promise((resolve) => {
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
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log("图片已删除");
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}