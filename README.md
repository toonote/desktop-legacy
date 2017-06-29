# TooNote

## 官网

<https://xiaotu.io>

## 介绍

请直接下载体验，或者浏览<https://github.com/TooBug/TooNote/blob/master/src/docs/welcome.md>

## 开发

Electron + Vue 2 + Vuex 2

开发时在源码目录下执行

```sh
npm start
```

即可。

## 打包

```sh
# for max osx
npm run build:osx
# for windows (both x86 & x64)
npm run build:win
```

## 备注

由于

1. 代码历史比较久，开发平台从Electron（当时还叫Atom-Shell）转到MacGap和Web，又转回Electron
2. 最早用vue 1开发，未使用vuex，最近升级到vue 2并引入vuex
3. 对基于vuex的应用代码架构不是很熟悉

所以代码比较乱，未做专门的整理，将就看
