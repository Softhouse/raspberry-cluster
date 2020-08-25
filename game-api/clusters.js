const fs = require('fs-extra');
const { KubeConfig, CoreV1Api } = require('@kubernetes/client-node');
const fileName = /^(.*?)\.yml$/;

let cache;
let clusters = {};
let cacheTS;

module.exports = async() => {
  if (!cacheTS || Date.now() - cacheTS > 10000) {
    const dir = __dirname + '/clusters/';
    const files = await fs.readdir(dir);
    
    const kcs = await Promise.all(files
      .filter(file => fileName.test(file))
      .map(async file => {
        const name = fileName.exec(file)[1];
        
        if (!clusters[name]) {
          const kc = new KubeConfig();
          await kc.loadFromFile(dir + file);
          const api = kc.makeApiClient(CoreV1Api);

          clusters[name] = {
              file,
              kc,
              name: fileName.exec(file)[1],
              api: () => api,
            };
        }

        return clusters[name];
      })
    );

    // const def = new KubeConfig();
    // def.loadFromDefault();
    // const api = def.makeApiClient(CoreV1Api);
    // kcs.push({
    //   file: 'default.yml',
    //   kc: def,
    //   name: 'default',
    //   api: () => api,
    // });

    cache = kcs;
    cacheTS = Date.now();
  }

  return cache;
}

// module.exports = [ def ]