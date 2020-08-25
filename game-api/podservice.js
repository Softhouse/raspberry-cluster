const { CoreV1Api } = require('@kubernetes/client-node');

function convert(data) {
  return {
    id: data.name,
    namespace: data.namespace,
    status: data.status.toLowerCase(),
    images: data.images,
    apiIndex: data.apiIndex,
    nodeName: data.nodeName,
  }
}

class PodService {
  constructor(clusters) {
    this.pods = [];
    this.clusters = clusters;
  }

  async find() {
    return this.pods;
  }

  async create(pod) {
    if (this.pods.findIndex(p => p.id === pod.id) === -1) {
      // Prevent duplicates
      this.pods.push(pod);
    }
    return pod;
  }

  async update(id, pod) {
    const index = this.pods.findIndex(p => p.id === id);
    if (index !== -1) {
      return this.pods[index] = pod;
    } else {
      throw new Error('No pod with ID', +id);
    }
  }

  async remove(id) {
    const vo = this.pods.find(p => p.id === id);
    if (vo) {
      const clusters = await this.clusters();
      const apis = clusters.map(c => c.api());
      const api = apis[vo.apiIndex];

      await api.deleteNamespacedPod(vo.id, vo.namespace, undefined, undefined, 0, undefined, 'Orphan');
      vo.status = 'terminating';
      return vo;
    } else {
      throw new Error(`No pod found with ID ${id}`);
    }
  }

  async pollPods() {
    const k8sPods = await this.getLeafPods();

    for (let i = 0; i < k8sPods.length; i++) {
      const pod = k8sPods[i];
      const existing = this.pods.find(e => e.id === pod.id);

      if (!existing) {
        this.create(pod)
      } else if(existing.status !== pod.status) {
        this.update(pod.id, pod)
      }
    }

    for (let i = this.pods.length - 1; i >= 0; i--) {
      const pod = this.pods[i];
      const index = k8sPods.findIndex(p => p.id === pod.id);

      if (index === -1) {
        this.pods.splice(i, 1) 
      }
    }

    setTimeout(() => {
      this.pollPods();
    }, 300);
  }

  async getLeafPods() {
    const clusters = await this.clusters();
    const apis = clusters.map(c => c.api());

    const result = await Promise.all(apis.map(async api => {
      try {
        const r = await api.listNamespacedPod(
          'default'
        )
        return r;
      } catch(e) {
        return undefined;
      }
    }));
    let pods = [];
    for (let i = 0; i < result.length; i++) {
      const apiResult = result[i];
      if (apiResult) {
        pods.push(...apiResult.response.body.items.map(item => Object.assign({
          index: i
        }, item)))
      }
    }

    pods = pods.map(
        vo => ({
          name: vo.metadata.name,
          namespace: vo.metadata.namespace,
          status: vo.metadata.deletionTimestamp ? 'terminating' : vo.status.phase,
          images: vo.spec.containers.map(c => c.image.split(':')[0]),
          apiIndex: vo.index,
          nodeName: vo.spec.nodeName,
        })
      )
      .filter(vo => vo.images.includes('istmowday/lmw-leaf'));

    // Remove duplicates
    const seen = {};
    return pods
      .filter(p => seen[p.name] ? false : (seen[p.name] = true))
      .map(p => convert(p))
      .sort((a, b) => a.id - b.id)
  }

  setup() {
    this.pollPods();
  }
}

module.exports = PodService;