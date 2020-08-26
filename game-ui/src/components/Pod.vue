<template>
  <div
    draggable="false"
    class="pod-wrapper"
    @click="terminate()"
    :class="{ inactive: this.state !== 'running', responded: this.responded }"
  >
    <img
      draggable="false"
      :src="this.image"
      width="100px"
    >
    <p draggable="false">{{label}}</p>
  </div>
</template>

<script>

const names = [
  'nucelar-controller',
  'critical-system',
  'gaming-service',
  'person-service',
  'account-service',
  'accounting-service',
  'org-service',
  'legal-service',
  'backoffice',
  'billing',
  'achievement-service',
  'bullshit-service',
  'custom-menu-provider',
  'customer-service',
  'mlg-servcice',
  'portal',
  'iam',
  'services-service',
  'boomtown-service',
  'cico',
  'postgres',
  'clobbernetes-service',
];

let iterator = 0;

export default {
  name: 'Pod',
  computed: {
    image() { return require('../assets/' + this.state + '_' + this.cluster + '.png') },
    label() { 
      // const a = this.name.split('-'); return a[a.length-1]
      // return names[Math.floor(Math.random() * names.length)];
      return this.hardLabel;
    },
    cluster() { return "unknown" },
  },
  data: () => ({
    hardLabel: 'unnamed'
  }),
  mounted() {
    this.hardLabel = names[(iterator++) % names.length];
  },
  props: {
    name: {
      type: String,
      required: true,
    },
    nodename: {
      type: String,
      required: false,
      default: 'unknown'
    },
    state: {
      type: String,
      required: true,
    },
    responded: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  methods: {
    terminate() {
      if (this.state === 'running') {
        this.$emit('terminate')
      }
    }
  }
}
</script>

<style>
.pod-wrapper {
  text-align: center;
  width: 150px;
  height: 150px;
  float: left;
  font-family: 'Boogaloo', cursive;
  font-size: 1.2em;
  white-space: nowrap;
  user-select: none;

  cursor: url("../assets/cursor.png") 10 35, auto;
}

.pod-wrapper.responded {
  color: orange;
}

.pod-wrapper:active {
  cursor: url("../assets/cursor_down.png") 10 15, auto;
}

.pod-wrapper.inactive {
  cursor: url("../assets/cursor_inactive.png") 10 35, auto;
}

.pod-wrapper > p {
  margin: 0;
  margin-top: -5px;
}

@import url('../assets/fonts/Boogaloo.css');
</style>