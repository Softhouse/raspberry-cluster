
class LPMService {
  constructor() {
    this.targets = {
      raspberrypi0: []
    }
  }

  async find() {
    const lpm = {};
    for(let k in this.targets) {
      lpm[k] = this.targets[k].length
    }
    return lpm;
  }

  async create({ target, timestamp }) {
    return this.targets[target].push({
      target,
      timestamp
    });
  }

  setup() {
    setInterval(() => {
      for(let k in this.targets) {
        while (this.targets[k].length !== 0 && Date.now() - this.targets[k][0].timestamp > 60000) {
          this.targets[k].shift();
        }
      }
    }, 1000);
  }
}

module.exports = LPMService;