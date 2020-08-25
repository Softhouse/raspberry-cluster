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
  'school',
  'eos-admin',
  'eos-pub',
  'person-service',
  'account-service',
  'accounting-service',
  'organisation-service',
  'legalentity-service',
  'backoffice',
  'billing',
  'ccui',
  'childcare-unit-manager',
  'custom-menu-provider',
  'customer-service',
  'dw',
  'portal',
  'iam',
  'se-export',
  'se-import',
  'boomtown-service',
  'cico',
  'postgres',
  'educloud-worker',
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