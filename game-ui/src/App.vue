<template>
  <div id="app">
    <main-area class="ma"></main-area>
  </div>
</template>

<script>
import MainArea from './components/MainArea.vue'

export default {
  name: 'app',
  components: {
    MainArea
  }
}
</script>

<style>
#app, html, body {
  width: 100%;
  height: 100%; 
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;

  cursor: auto;
}

.ma {
  margin: auto auto;
}

#app {
  background-image: url("./assets/background2.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
  display: block;
}
</style>
