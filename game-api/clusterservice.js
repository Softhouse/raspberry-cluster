
class ClusterService {
  constructor(clusters) {
    this.clusters = clusters;
  }

  async find() {
    const clusters = await this.clusters();
    return clusters.map(c => c.name);
  }
}

module.exports = ClusterService;