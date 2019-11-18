# Workshop

In this workshop we'll set up a raspberry pi cluster and run some configuration scenarios to familiarize you with kubernetes cluster administration.

## Prerequsities

The raspberry pi cluster is connected to the internet and is accessible from the workstation.

### Tools

```sh
brew install nmap
```

### Install docker

On each node, `raspberrypi0.local` through `raspberrypi4.local` install docker, turn off swap, install kubeadm and enable cgroups:

Slightly modified from  [source](https://gist.github.com/alexellis/fdbc90de7691a1b9edb545c17da2d975).

```sh
ssh pi@k8-t1-n1.local '
curl -sSL get.docker.com | sh
#sudo usermod pi -aG docker

curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
  echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list && \
  sudo apt-get update -q && \
  sudo apt-get install -qy kubeadm
'
```

### Master Node

On the master node (only 1)

See "Master Node Setup" from [source](https://medium.com/nycdev/k8s-on-pi-9cc14843d43) for more information

Prepare the master node, once joined create a locally owned copy of the kubernetes credentials that can be copied to the workstation using scp:

```sh
ssh pi@k8-t1-n1.local '
sudo kubeadm config images pull -v3
sudo kubeadm init --token-ttl=0
sudo cp /etc/kubernetes/admin.conf .
sudo chown $(id -u):$(id -g) admin.conf
'
```

The command finishes successfully with:

```terminal
...
Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.10.140:6443 --token r3xyoq.t92yjpgsdrf0y7e4 \
    --discovery-token-ca-cert-hash sha256:0d919582cbce47e25a8ac22f7166c9633816475b8a87be749d62953c0ef492f0
```

### Slaves

To join the slaves you can manually log in to each node and run the command, or execute:

```sh
TOKEN=$(ssh pi@k8-t1-n1.local sudo kubeadm token list  | awk 'NR==2 {print $1}')
CERT_HASH=$(ssh pi@k8-t1-n1.local openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //')
for i in {2..3}; do
ssh pi@k8-t1-n${i}.local sudo kubeadm join k8-t1-n1:6443 --token ${TOKEN} --discovery-token-ca-cert-hash sha256:${CERT_HASH}
done
```

### kubectl Credentials for the master node

Get the credentials from the master node:

```sh
scp pi@raspberrypi0.local:~/admin.conf $HOME/.kube/config.raspberry

export KUBECONFIG=~/.kube/config.raspberry
sed -i -e 's#server: .*#server: https://raspberrypi0:6443#' $KUBECONFIG
```

### Is working?
nope....
```
kubectl get nodes
```
:(

```
kubectl get pods -n kube-system
```
Coredns is sad because no friends

### Add a network driver

 Install the Weave Net network driver

```sh
kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
```

Test that the network driver has started successfully by checking the status of the pods in the kube-system namespace:

```sh
kubectl get pods -n kube-system
```

All pods should be in `Running` state

```terminal
coredns-5644d7b6d9-bnnbd               1/1     Running   0          159m
coredns-5644d7b6d9-srxpc               1/1     Running   0          159m
etcd-raspberrypi0                      1/1     Running   3          158m
kube-apiserver-raspberrypi0            1/1     Running   3          158m
kube-controller-manager-raspberrypi0   1/1     Running   4          158m
kube-proxy-228w8                       1/1     Running   3          107m
kube-proxy-d5hs7                       1/1     Running   3          106m
kube-proxy-fd8lw                       1/1     Running   3          106m
kube-proxy-h4jnm                       1/1     Running   3          159m
kube-proxy-k6z7n                       1/1     Running   3          120m
kube-scheduler-raspberrypi0            1/1     Running   4          158m
weave-net-dhfnz                        2/2     Running   11         27m
weave-net-f7c5c                        2/2     Running   11         27m
weave-net-kpk4j                        2/2     Running   10         27m
weave-net-m8fr4                        2/2     Running   12         27m
weave-net-rb8vf                        2/2     Running   11         27m
```

## Blinkt

From [Source](https://github.com/apprenda/blinkt-k8s-controller)

https://github.com/apprenda/blinkt-k8s-controller

1. Attach labels to nodes that have LEDS attached. Affinity is set on the pods running the LED driver ensuring that nodes with a perticular hardware has the blinkt controller running:

    ```sh
        #kubectl taint nodes raspberrypi0 node-role.kubernetes.io/master=:NoSchedule
        kubectl taint nodes k8-t1-n1 node-role.kubernetes.io/master:NoSchedule-
        kubectl label node k8-t1-n1 deviceType=blinkt
        kubectl label node k8-t1-n2 deviceType=blinkt
        kubectl label node k8-t1-n3 deviceType=blinkt
    ```

1. Set Role Based Acces Control (RBAC) policies to allow the blinkt controller to run with the proper permissions. RBAC controls access to the kubernetes API and namespaces, allowing fine grained access control of cluster resources.

    ```sh
    kubectl create -f https://raw.githubusercontent.com/apprenda/blinkt-k8s-controller/master/kubernetes/blinkt-k8s-controller-rbac.yaml
    ```

1. Add the controller as a Daemonset, this will add the pod to all nodes, the label will discriminate which nodes it will be added to. We'll need to patch the API version of the file and read the resulting file from standard input:

    ```sh
    kubectl apply -f blinkt-k8s-controller-ds.yaml
    ```

### Running an Application

1. run kubernetes-rocks on the cluster. It's configured to run with 2 replicas and show a blue color on the leds, so you should have 2 leds.

    ```sh
    kubectl apply -f kubernetes-rocks.yaml
    ```

1. Let's connect to it: It's running as a NodePort service, which will assign a random free port on all cluster nodes. This is generally used in conjunction with a front facing load balancer:

    ```sh
    kubectl get svc kubernetes-rocks
    #kubernetes-rocks   NodePort   10.105.251.110   <none>        8000:30631/TCP   11m
    ```

    The service is assigned to port 30631, browsing to `http://raspberrypi0:30631` should show the page.

1. Which node is it running on?

    The App looks for a lable on the node called failure domain:

    ```sh
    kubectl label node k8-t1-n1 failure-domain.beta.kubernetes.io/zone=k8-t1-n1
    kubectl label node k8-t1-n2 failure-domain.beta.kubernetes.io/zone=k8-t1-n2
    kubectl label node k8-t1-n3 failure-domain.beta.kubernetes.io/zone=k8-t1-n3
    ```

    Reload the web page, the failure zone should be visible in the top right corner

1. Let's scale it

    ```sh
    kubectl scale --replicas=5 deployment/kubernetes-rocks
    ```

    Reloading the page shows the traffic being routed to different services

### Ingress Controller

An ingress controller configures ingress resources that allow traffic into the cluster:

1. install helm

    ```sh
    curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
    ```

    Add the stable repo:

    ```sh
    helm repo add stable https://kubernetes-charts.storage.googleapis.com/
    ```

    Install nginx as ingress controller:

    ```sh
    helm upgrade --install --force ingress-controller stable/nginx-ingress \
      --set controller.replicaCount=2 \
      --set controller.service.type=NodePort \
      --set controller.service.nodePorts.http=30080 \
      --set controller.service.nodePorts.https=30443 \
      --set controller.service.omitClusterIP="true" \
      --set controller.image.repository=quay.io/kubernetes-ingress-controller/nginx-ingress-controller-arm \
      --set controller.podLabels.blinkt=show \
      --set controller.podLabels.blinktColor=0000FF \
      --set defaultBackend.replicaCount=2 \
      --set defaultBackend.image.repository=gcr.io/google_containers/defaultbackend-arm \
      --set defaultBackend.service.omitClusterIP="true" \
      --set defaultBackend.podLabels.blinkt=show \
      --set defaultBackend.podLabels.blinktColor=FF0080
    ```

1. Configure the service to use the ingress

    ```sh
    kubectl apply -f kubernetes-rocks-ingress.yaml
    ```

### Maintenance

1. Cordon and Drain a node to offload services:

    ```sh
    kubectl cordon k8-t1-n1
    kubectl drain k8-t1-n1 --ignore-daemonsets
    ```

    The node can now safely be managed.

    uncordon the node to allow workloads to be scheduled again.

    ```sh
    kubectl uncordon raspberrypi1
    ```

### Chaos

1. Install the kubernetes dashboard for simple service monitoring

    ```sh
    helm upgrade --install --force chaos stable/chaoskube \
    --set imageTag=v0.16.0-arm32v6 \
    --set namespaces=default \
    --set labels="app.kubernetes.io/name=lmw-leaf" \
    --set dryRun=false \
    --set rbac.create=true \
    --set interval=200ms
    ```

1. Let's put some load on

    Through the nodeport service

    ```sh
    npm install -g artillery
    artillery quick --count 10 -n 20 http://raspberrypi0:30631
    ```

    Through the ingress:

    ```sh
    artillery quick --count 10 -n 20 http://raspberrypi0:30080
    artillery quick --count 10 -n 20 http://raspberrypi0:30443
    ```

### Affinity

Affinity and anti-affinity can control which pods are scheduled together. Let's separate app pods from loadbalancer pods:

1. Add an anti-affinity to the worker pods:

    ```sh
        spec:
          affinity:
    #        podAntiAffinity:
    #          requiredDuringSchedulingIgnoredDuringExecution:
    #          - labelSelector:
    #              matchExpressions:
    #              - key: app
    #                operator: In
    #                values:
    #                - nginx-ingress
    #            topologyKey: "kubernetes.io/hostname"
    ```

    The yellow worker pods are now separate from the blue loadbalancer pods

### Dashboard

Let's add the kubernetes management dashboard, see [source](https://hub.docker.com/r/kubernetesui/dashboard) for more information:

```sh
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta6/aio/deploy/recommended.yaml
```

make the service account admin so all resources can be viewed and managed. This is not reocommended for production systems:

```sh
kubectl create clusterrolebinding kubernetes-dashboard-admin-binding --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:kubernetes-dashboard
```

Get the auth token and start the proxy server:

```sh
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | awk '/^kubernetes-dashboard-token-/{print $1}') | awk '$1=="token:"{print $2}'
kubectl proxy
```

browse to `http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/#/login`, select **Token** login and paste the toke  from the above command.

```sh
curl -sSL https://raw.githubusercontent.com/kubernetes/heapster/master/deploy/kube-config/influxdb/grafana.yaml | sed "s@image: .*@image: angelnu/heapster-grafana:v5.0.4@" | sed 's@value: /$@#value: /@g' | sed 's/# value:/value:/g' > grafana.yaml
curl -sSL https://raw.githubusercontent.com/kubernetes/heapster/master/deploy/kube-config/influxdb/heapster.yaml | sed "s@image: .*@image: angelnu/heapster:v1.5.4@" > heapster.yaml
curl -sSL https://raw.githubusercontent.com/kubernetes/heapster/master/deploy/kube-config/influxdb/influxdb.yaml | sed "s@image: .*@image: angelnu/heapster-influxdb:v1.3.3@" > influxdb.yaml
```

