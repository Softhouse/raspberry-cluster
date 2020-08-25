<template>
  <div class="main-area">
    <div>
    <scoreboard
      :pods="runningPods"
    ></scoreboard>
    <l-p-m-display
      v-for="team in clusters"
      :key="team"
      :team="team"
      :value="lpm[team]"
    ></l-p-m-display>
    <!-- <l-p-m-display
      team="5"
      :value="lpm.t5"
    ></l-p-m-display>
    <l-p-m-display
      team="4"
      :value="lpm.t4"
    ></l-p-m-display>
    <l-p-m-display
      team="3"
      :value="lpm.t3"
    ></l-p-m-display>
    <l-p-m-display
      team="2"
      :value="lpm.t2"
    ></l-p-m-display>
    <l-p-m-display
      team="1"
      :value="lpm.t1"
    ></l-p-m-display>-->
    </div> 
    <div>
      <div class="pod-holder">
        <pod
          v-for="pod in pods"
          :key="pod.id"
          :name="pod.id"
          :nodename="pod.nodeName"
          :state="pod.status"
          :responded="pod.status === 'running' && pod.id === currentPod"
          v-on:terminate="terminatePod(pod)"
        ></pod>
      </div>
    </div>
  </div>
</template>

<script>
import Pod from './Pod.vue'
import Scoreboard from './Scoreboard.vue'
import LPMDisplay from './LPMDisplay.vue'

export default {
  name: 'MainArea',
  components: {
    Pod,
    Scoreboard,
    LPMDisplay,
  },
  computed: {
    runningPods() {
      return this.pods.filter(p => p.status === 'running').length;
    }
  },
  data: () => ({
    pods: [],
    pummels: [],
    clusters: [],
    currentPod: undefined,
    lpm: { t1: 0, t2: 0, t3: 0, t4: 0, t5: 0 },
  }),
  mounted() {
    this.update();
    setInterval(() => {
      this.updatePummel();
    }, 100);

    window.blowUp = () => {
      this.pods
        .filter(pod => pod.status === 'running')
        .map(pod => this.terminatePod(pod))
    }
  },
  methods: {
    async update() {
      try {
        const podData = await fetch('http://localhost:3030/pods');
        this.pods = await podData.json();

        const pummelData = await fetch('http://localhost:3030/pummels');
        this.pummels.push(...await pummelData.json());

        const lpmData = await fetch('http://localhost:3030/lpm');
        this.lpm = await lpmData.json();

        const clusterData = await fetch('http://localhost:3030/clusters');
        this.clusters = await clusterData.json();

        if (this.pummels.length > 200) {
          this.pummels.length = 100;
        }
      } catch {
        // Ignore
      }

      setTimeout(() => {
        this.update();
      }, 300);
    },
    updatePummel() {
      if (this.pummels.length > 0) {
        this.currentPod = this.pummels.shift();
      } else {
        this.currentPod = undefined;
      }
    },
    async terminatePod(pod) {
      try {
        const data = await fetch(`http://localhost:3030/pods/${pod.id}`, { method: 'DELETE' })
        if (data.status === 200) {
          const removed = await data.json();
          const index = this.pods.findIndex(p => p.id === removed.id);
          this.pods[index].status = 'terminating';
        }
      } catch(e) {
        console.log('Error terminating pod', e)
      }
    }
  }
}
</script>

<style scoped>
.main-area {
  width: 95%;
  height: 950px;
  margin-top: 100px;
  border: 5px rgba(0,0,0,0.8) solid;
  background-image: url("../assets/holder_background.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center center;
  position: relative;
  cursor: url("../assets/cursor.png") 10 35, auto;
}

.pod-holder {
  position: absolute;
  top: 110px;
}
</style>