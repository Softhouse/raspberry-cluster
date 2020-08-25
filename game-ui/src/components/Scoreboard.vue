<template>
  <div class="scorboard-holder">
    <div>IST Cloud presents</div>
    <div class="points">Whack-A-Pod</div>
    <div>{{ subtitle }}</div>
  </div>
</template>

<script>
export default {
  name: 'Scoreboard',
  computed: {
    subtitle() {
      if (this.pods !== -1) {
        return `${this.pods} pods`;
      } else {
        return 'for LMW';
      }
    }
  },
  props: {
    pods: {
      type: Number,
      required: false,
      default: -1,
    }
  }
}
</script>

<style>
.scorboard-holder {
  width: 300px;
  height: 200px;
  background-image: url("../assets/sign.png");
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center center;
  transform: perspective(1px) translateY(-50%);
  position: relative;
  float: left;
  top: 0;
  right: 0;
}

.scorboard-holder > div {
  font-family: 'Boogaloo', cursive;
  text-align: center;
  font-size: 1.5em;
}

.scorboard-holder > div.points {
  font-size: 2.5em;
}

.scorboard-holder> div:first-child {
  padding-top: 45px;
}

@import url('../assets/fonts/Boogaloo.css');
</style>
