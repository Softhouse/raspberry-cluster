# Workshop

In this workshop we'll set up a raspberry pi cluster and run some configuration scenarios to familiarize you with kubernetes cluster administration.

## Prerequsities

The raspberry pi cluster is connected to the internet and is accessible from your laptop or workstation.

Basic knowledge of linux and SSH is expected

Each team has been given their own raspberry pi cluster with unique IP addresses and node names. Each raspberrypi has been preconfigured to run kubernetes.

### Tools

**Linux shell:** with ssh support and the kubernetes-CLI (kubectl) installed.

**Node:** any version of node.js or your favourite tool to generate http load

## Creating a Kubernetes cluster

### Pi configuration

On each pi, change the name, disable swap, cgroups and enable ssh

1. Change the name

```sh
echo "raspberrypi4" | sudo tee /etc/hostname
# TODO remove original hostname on the last line
echo "127.0.1.1	raspberrypi4" | sudo tee -a /etc/hosts
```

1. Disable swap

```sh
sudo dphys-swapfile swapoff &&
sudo dphys-swapfile uninstall &&
sudo systemctl disable dphys-swapfile
```

1. Enable cgroups

```sh
echo " cgroup_enable=cpuset cgroup_memory=1 cgroup_enable=memory" >> /boot/cmdline.txt
```

1. enable ssh

```sh
touch /boot/ssh
```

1. update

```sh
sudo rpi-update
```

1. iptables legacy

```sh
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
sudo sysctl net.bridge.bridge-nf-call-iptables=1
```

1. reboot

```sh
sudo reboot
```

### Install docker and kubernetes

1. Install Docker

    Kubernetes is an container orchestrator that runs on docker.

    Run the following command to install docker comminuty edition on the node:

    ```sh
    curl -sSL get.docker.com | sh
    ```

1. Install kubeadm

    Kubernetes is managed through APIs on both master and worker nodes. `kubeadm` is used for cluster administration, such as joining a cluster.

    Install the kubeadm tool on your node:

    ```sh
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
    echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list && \
    sudo apt-get update -q && \
    sudo apt-get install -qy kubeadm
    ```

This step is based on the following [source](https://gist.github.com/alexellis/fdbc90de7691a1b9edb545c17da2d975).

1. pull kubeadm images

```sh
sudo kubeadm config images pull
```

### Find the hosts

1. get the network range

```sh
ifconfig
```

1. scan the network for hosts:

IP addresses should be used when joining the cluster since we're using mDNS and not a proper DNS server:

```sh
sudo nmap -sn 192.168.1.0/24
```

```output
Nmap scan report for 192.168.0.100
Host is up (0.00058s latency).
MAC Address: DC:A6:32:12:C1:68 (Raspberry Pi Trading)
Nmap scan report for 192.168.0.101
Host is up (0.00057s latency).
MAC Address: DC:A6:32:12:C1:A7 (Raspberry Pi Trading)
Nmap scan report for 192.168.0.103
Host is up (0.00057s latency).
MAC Address: DC:A6:32:12:C1:A1 (Raspberry Pi Trading)
Nmap scan report for 192.168.0.105
Host is up (0.00064s latency).
MAC Address: DC:A6:32:5F:B6:06 (Raspberry Pi Trading)
Nmap scan report for 192.168.0.106
Host is up (0.00063s latency).
MAC Address: DC:A6:32:12:C2:C4 (Raspberry Pi Trading)
```

<https://medium.com/developingnodes/setting-up-kubernetes-cluster-on-raspberry-pi-15cc44f404b5>

### Initialize the master

Execute the follwing command on the master:

```sh
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
```

copy the kubeconfig file

```sh
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### Join the nodes

Execute the command output from the master on each worker node to join the master:

```sh
sudo kubeadm join 192.168.1.101:6443 --token h6wf20.u2db8cdxr83hrloq \
    --discovery-token-ca-cert-hash sha256:ffaf845205a3cca38859c900861bd01e28353ec93009cd35cb405e717e1b3c6b
```

### Flannel

Flannel is a simple and easy way to configure a layer 3 network fabric designed for Kubernetes.

```sh
    kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
    kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/k8s-manifests/kube-flannel-rbac.yml
```

Wait until the coros pods are ready:

```sh
kubectl wait --for=condition=Ready pod -l k8s-app==kube-dns -n kube-system
```

## Blinkt

1. Grant access to the blinkt pods to get pod information from the kubernetes API:

    ```sh
    kubectl create -f https://raw.githubusercontent.com/apprenda/blinkt-k8s-controller/master/kubernetes/blinkt-k8s-controller-rbac.yaml
    kubectl create -f https://raw.githubusercontent.com/jonaseck2/raspberry-cluster/master/blinkt-k8s-controller-ds.yaml
    ```

1. Label the nodes to start the daemonset pods on the node

   ```sh
   kubectl label node --all deviceType=blinkt
   ```

1. Untaint the master to schedule a pod there as well

   ```sh
   kubectl taint nodes --all node-role.kubernetes.io/master-
   ```

## Whack a pod

### game-api

1. place the kubeconfig file in the api cluster folder

```sh
scp pi@raspberrypi0.local:~/.kube/config game-api/clusters/raspberrypi0.yaml
```

1. npm install and start

```sh
cd game-api
npm install
npm start
```

start a new terminal

### game-ui

1. npm install and start

```sh
npm install
npm start
```

1. Add some moles

```sh
kubectl apply -f https://raw.githubusercontent.com/jonaseck2/raspberry-cluster/master/deployment.yaml
```

```sh
kubectl scale deployment.v1.apps/lmw-leaf --replicas=25
```

