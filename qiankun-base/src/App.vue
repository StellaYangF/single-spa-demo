<template>
  <div id="app">
    <el-menu :router='true' mode='horizontal'>
      <el-menu-item index='/'>home</el-menu-item>
      <el-menu-item index='/vue'>vue</el-menu-item>
      <el-menu-item index='/react'>react</el-menu-item>
    </el-menu>
    <router-view/>
    <div id='vue'></div>
    <div id='react'></div>
  </div>
</template>

<style lang="scss">

</style>
