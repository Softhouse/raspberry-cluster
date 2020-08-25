<template>
  <div class="lpm-display-holder">
    <div>{{teamName}}</div>
    <div class="points" :class="colorClass">{{value}}</div>
    <div>lost per minute</div>
  </div>
</template>

<script>
export default {
  name: 'LPMDisplay',
  computed: {
    colorClass() { return this.team; },
    teamName() { return 'Team ' + this.team.substr(-1) },
  },
  props: {
    team: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  }
}
</script>

<style>
.lpm-display-holder {
  width: 11%;
  height: 100px;
  background-image: url("../assets/sign.png");
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center center;
  transform: perspective(1px) translateY(-50%);
  position: relative;
  top: 0;
  right: 0;
  float: right;
}

.lpm-display-holder > div {
  font-family: 'Boogaloo', cursive;
  text-align: center;
  font-size: 0.8em;
}

.lpm-display-holder > div.points {
  font-size: 1.5em;
  margin-top: -8px;
}

.lpm-display-holder> div:first-child {
  padding-top: 28px;
}

.lpm-display-holder> div:last-child {
  margin-top: -8px;
}


@media only screen and (max-width: 1024px) {
  .lpm-display-holder {
    height: 50px;
  }

  .lpm-display-holder > div {
    display: none;
  }

  .lpm-display-holder > div.points {
    padding-top: 23px;
    font-size: 1em;
    display: inherit;
  }
}

.raspberrypi0 {
  color: #E72C2B;
}

.t2 {
  color: #123EFF;
}

.t3 {
  color: #12850C;
}

.t4 {
  color: #CC00CC;
}

.t5 {
  color: #1398A3;
}

@import url('../assets/fonts/Boogaloo.css');
</style>
