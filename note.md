```js
registerApplication('myVueApp', async () => {
    // 加载公共代码
    loadScript('vendors.js')
    // 加载 app.js
    loadScript('app.js')


})
```

## 设置
__webpack_public_path__ = 'newUrl'; 

## 缺陷

* 不够灵活，不能动态加载 js 文件
* 样式不隔离，


# qiankun

应用拆分为多个子应用

## qiankun-base

## qiankun-vue

## qiankun-react

修改 react webpack 配置

```bash
yarn add react-app-rewired
```