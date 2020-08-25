const axios = require('axios');

class PummelService {
  constructor(targets, lpm) {
    this.targets = targets;
    this.lpm = lpm;
    this.pummels = [];
  }

  async find() {
    const a = this.pummels;
    this.pummels = [];
    return a;
  }

  async pummel() {
    await Promise.all(this.targets.map(async target => {
      try {
        const result = await axios.get(target.uri, { timeout: 100 });
        this.pummels.push(result.data.id)

        // Prevent overflow
        if (this.pummels.length > 200) {
          this.pummels.length = 100;
        }
      } catch {
        this.lpm.create({
          timestamp: Date.now(),
          target: target.name,
        })
      }
    }));
  }

  setup() {
    setInterval(() => {
      this.pummel();
    }, 150);
  }
}

module.exports = PummelService;