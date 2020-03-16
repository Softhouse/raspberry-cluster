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

Each cluster consists of 4 nodes. Organize yourselves so that each team member chooses 1 node to configure then perform the following steps, entering the default password `raspberry` as password when prompted:

1. Clone this repo

1. SSH into your node `k8-t<team>-n<node>`

    **NOTE** Depending on your network or mDNS configuration, `.local`, `.lan` or `.localdomain` may have to be added as suffix to the host.

    ```sh
    ssh pi@k8-t<team>-n<node>
    ```

    **Example:** `ssh pi@k8-t1-n1.local`

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

### Master Node

One or more nodes in the cluster is responsible for managing the worker nodes. A cluster is created by initializing one or more masters and then joining worker nodes to the cluster.

The kubernetes API resides on the master node(s). The kubernetes CLI `kubectl` sends API requests to the master which in turn sends requests to the kubelet api on each worker node.

**NOTE** This should only be executed on the master node - node number `1`. If your node has a different number, please continute to the **Worker Nodes** section and keep asking your master node teammate for the join command.

1. Pull the images to speed up the init process and avoid potential timeout:

    ```sh
    sudo kubeadm config images pull
    ```

1. Initialize the cluster, your teammates will have to join within 10 minutes:

    **NOTE:** If you are assigned node number `4` do not join the cluster at this stage. If you accidentally do, please execute `sudo kubeadm reset` on the node and `kubectl delete node k8-t<team>-n4` to remove yourself from the cluster.

    ```sh
    sudo kubeadm init --token-ttl=10m
    ```

    The command finishes successfully with the following message:

    **Note** the token and hash is unique for each master

    ```terminal
    ...
    Then you can join any number of worker nodes by running the following on each as root:

    kubeadm join 192.168.10.140:6443 --token r3xyoq.t92yjpgsdrf0y7e4 \
        --discovery-token-ca-cert-hash sha256:0d919582cbce47e25a8ac22f7166c9633816475b8a87be749d62953c0ef492f0
    ```

    send the command to your teammates as they will use this to join to your master node

    This step is based on the "Master Node Setup" from this [source](https://medium.com/nycdev/k8s-on-pi-9cc14843d43).

### Worker Nodes

Get the join command containing the token and certificate hash from the team member assigned to the master node.

**NOTE** If you have node number 4, please wait with this step. Only nodes 1, 2 and 3 should be added to the cluster at this stage.

1. Execute the command and join the master to form a cluster:

    ```sh
    ssh pi@k8-t<team>-n<node>
    sudo kubeadm join k8-t1-n1:6443 --token <TOKEN> --discovery-token-ca-cert-hash sha256:<CERT_HASH>
    ```

### kubectl Credentials for the master node

kubectl stores credentials in a config file. Multiple credentials, or contexts, can be stored in the same file. Commands are sent to the active context.

1. Log in to the **master node** and create a copy of the credentials that is readable by the pi user:

    ```sh
    mkdir -p ~/.kube
    sudo cp /etc/kubernetes/admin.conf ~/.kube/config
    sudo chown $(id -u):$(id -g) ~/.kube/config
    ```

1. On your **laptop or workstation** copy the credentials file using scp:

    **Warning** If you have existing kubernetes configuration, back it up before executing the command below as it will overwrite the configuration.

    ```sh
    mkdir -p ~/.kube
    scp pi@k8-t<team>-n1:~/.kube/config ~/.kube/config
    ```

1. Check the status of the nodes:

    ```sh
    kubectl get nodes
    ```

    The nodes are connected but not ready to recieve workloads.

    ```terminal
    k8-t1-n1   NotReady   master   6m39s   v1.16.3
    k8-t1-n2   NotReady   <none>   5m45s   v1.16.3
    k8-t1-n3   NotReady   <none>   5m41s   v1.16.3
    k8-t1-n4   NotReady   <none>   5m37s   v1.16.3
    ```

1. Check the status of the pods in the kubernetes system namespace:

    ```sh
    kubectl get pods -n kube-system
    ```

    The coredns pods are running, but not answering on health checks due to a missing network driver

    ```terminal
    NAME                                   READY   STATUS    RESTARTS   AGE
    coredns-5644d7b6d9-nsvl9           0/1     Pending   0          3m16s
    coredns-5644d7b6d9-s62lp           0/1     Pending   0          3m16s
    etcd-k8-t5-n1                      1/1     Running   0          2m24s
    kube-apiserver-k8-t5-n1            1/1     Running   0          2m16s
    kube-controller-manager-k8-t5-n1   1/1     Running   0          2m37s
    kube-proxy-bb5p6                   1/1     Running   0          2m14s
    kube-proxy-m48xp                   1/1     Running   0          3m16s
    kube-proxy-wcdrr                   1/1     Running   0          2m2s
    kube-scheduler-k8-t5-n1            1/1     Running   0          2m13s
    ```

## Add a network driver

 The node network driver adds an overlay network on the cluster that allows cross-node communication.

 1. Install the Weave Net network driver.

    ```sh
    kubectl apply -f "https://cloud.weave.works/k8s/net?k8s-version=$(kubectl version | base64 | tr -d '\n')"
    ```

    This adds a damonset resouce, which adds a pod on each node, providing the overlay network.

1. Check the status of the pods in the kube-system namespace:

    ```sh
    kubectl get pods -n kube-system
    ```

    Wait until all pods are in the `Running` state. Note that weave-net pods have been added to all nodes. To see which pod is running on what node `-o wide` can be added to the above command.

    ```terminal
    NAME                             READY  STATUS  RESTARTS AGE
    coredns-5644d7b6d9-bnnbd         1/1    Running 0        159m
    coredns-5644d7b6d9-srxpc         1/1    Running 0        159m
    etcd-k8-t1-n1                    1/1    Running 3        158m
    kube-apiserver-k8-t1-n1          1/1    Running 3        158m
    kube-controller-manager-k8-t1-n1 1/1    Running 4        158m
    kube-proxy-228w8                 1/1    Running 3        107m
    kube-proxy-d5hs7                 1/1    Running 3        106m
    kube-proxy-fd8lw                 1/1    Running 3        106m
    kube-proxy-h4jnm                 1/1    Running 3        159m
    kube-proxy-k6z7n                 1/1    Running 3        120m
    kube-scheduler-k8-t1-n1          1/1    Running 4        158m
    weave-net-dhfnz                  2/2    Running 11       27m
    weave-net-f7c5c                  2/2    Running 11       27m
    weave-net-kpk4j                  2/2    Running 10       27m
    weave-net-m8fr4                  2/2    Running 12       27m
    weave-net-rb8vf                  2/2    Running 11       27m
    ```

## Blinkt LEDs

For educational purposes, we use LEDs to show the loads running on the cluster. Each led signifies one pod which is running one or more containers. `Ready 1/1` in the command above signifies that 1 out of 1 containers in the pod are responding to health checks and ready to serve traffic.

When pods are terminated, a grace period allows for graceful termination of services. For his reason, it takes a few seconds for a LED to turn off after it's been terminated.

Table of LED colors:
|Color       |Pods|
|------------|----|
|<span style="color:red">Red</span>  |whack a pod (initially)
|<span style="color:white">White</span>  |whack a pod (after upgrade)
|<span style="color:yellow">Yellow</span>  |node presentation
|<span style="color:blue">Blue</span> | nginx ingress
|<span style="color:purple">Purple</span> |404-service
|<span style="color:green">Green flash</span> |pod is starting
|<span style="color:red">Red flash</span>   |pod is terminating

1. Grant access to the blinkt pods to get pod information from the kubernetes API:

    ```sh
    kubectl create -f https://raw.githubusercontent.com/apprenda/blinkt-k8s-controller/master/kubernetes/blinkt-k8s-controller-rbac.yaml
    ```

    Role Based Acces Control (RBAC) policies specify which kubernetes API calls can be made, in which namespaces by which users or service accounts. This allows for fine grained access control of kubernetes resouces.

    To show the status of the pods in the cluster, the blinkt pods must be allowed to read pod status from the API.

    The policy below Creates a service account that is bound to the cluster admin role, allowing the pods full access to all kubernetes APIs, this is not recommended in production.

1. Add the blinkt controller:

    ```sh
    kubectl apply -f blinkt-k8s-controller-ds.yaml
    ```

    The blinkt controller is added as a deamonset. Daemonsets add a pod to each node in the cluster. This is typically used for services that need to run on all nodes, like logging and monitoring agents.

1. Check that the daemonset has been added:

    ```sh
    kubectl get daemonset -n kube-system
    ```

    ```terminal
    NAME                    DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                 AGE
    blinkt-k8s-controller   0         0         0       0            0           deviceType=blinkt             8s
    kube-proxy              3         3         3       3            3           beta.kubernetes.io/os=linux   9m24s
    weave-net               3         3         3       3            3           <none>                        2m1s                      2m1s
    ```

    The Daemonset reports that it wants 0 pods running in the cluster. Looking at the `NODE SELECTOR` column, we can see that it requires a label on the node to start the pod. This way, node labels can be used to add services that have special hardware or requirements.

1. Label the nodes to enable the blinkt controller

    ```sh
    kubectl label node k8-t<team>-n1 deviceType=blinkt
    kubectl label node k8-t<team>-n2 deviceType=blinkt
    kubectl label node k8-t<team>-n3 deviceType=blinkt
    ```

    The leds should flash all green as the daemonset starts on the node.

1. Check the number of desired pods in the daemonset:

    ```sh
    kubectl get daemonset -n kube-system
    ```

    ```terminal
    NAME                  DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR                 AGE
    blinkt-k8s-controller 2         2         2       2            2           deviceType=blinkt             21h
    kube-proxy            5         5         5       5            5           beta.kubernetes.io/os=linux   22h
    weave-net             5         5         5       5            5           <none

    Three nodes were labeled, but only 2 pods were scheduled. This is due to workloads not being allowed to run on the master node.

1. remove the NoSchedule taint on the master node:

    ```sh
    kubectl taint nodes k8-t<team>-n1 node-role.kubernetes.io/master:NoSchedule-
    ```

    The LEDs will flash green on the master as the pod is scheduled and started.

    If you want to taint it again, execute the following command, you'll see the daemonset flashing red as the pod is evicted.

    ```sh
    kubectl taint nodes k8-t<team>-n1 node-role.kubernetes.io/master=:NoSchedule
    ```

    Untaint the master again so that all LED strips are active.

This section is from [Source](https://github.com/apprenda/blinkt-k8s-controller).

## Run an application

1. Deploy an application in the cluster

    ```sh
    kubectl apply -f deployment.yaml
    ````

    The application runs as a deployment, and will be scheduled on any node which has enough resources to run it.

    The deployment runs with 5 replicas, so 5 RED LEDs should light up on your nodes

1. Check which nodes the pods are running

    ```sh
    kubectl get pods -o wide
    ```

    The LEDs should match the `NODE` column

    ```terminal
    NAME                      READY  STATUS  RESTARTS   AGE   IP         NODE        
    lmw-leaf-58cbf5674-7czpc  1/1    Running 0          14m   10.40.0.1  t<team>_n1  
    lmw-leaf-58cbf5674-kqb95  1/1    Running 0          14m   10.32.0.9  t<team>_n3
    lmw-leaf-58cbf5674-wp9rd  1/1    Running 0          14m   10.38.0.1  t<team>_n2
    lmw-leaf-58cbf5674-lp264  1/1    Running 0          14m   10.43.0.3  t<team>_n2
    lmw-leaf-58cbf5674-vrttg  1/1    Running 0          14m   10.44.0.8  t<team>_n3
    ```

    Look at the whack a pod board. Your team should now have 5 moles ready to be whacked.

1. Let's upgrade it:

    Kubernets uses rolling upgrades by default. That means that old pods are terminated (as many as the disriuption budget allows) as new ones are started. When the new pods answer on health checks the remaining pods are terminated. This means upgrades can be performed without downtime

    Red is a negative color, edit the `deployment.yaml`, commenting out the `blinktColor: FF0000 #red` line and using a hash (#) character, and removing the comment from the `#blinktColor: FFFFFF #white`.

    ```sh
    kubectl apply -f deployment.yaml
    ```

    Leds should show pods gradually being terminated, replacing red with white. Looking at the whack a pod screen.

1. Let's scale it:

    ```sh
    kubectl scale --replicas=12 deployment/lmw-leaf
    ```

    Lot's of moles and gren LEDs! Check the status

    ```sh
    kubectl get pods
    ```

    A few of the pods are in Pending state:

    ```terminal
    NAME                      READY STATUS  RESTARTS AGE
    lmw-leaf-68f4cc7f5d-gm79b 0/1   Pending 0        103s
    ```

1. Figure out why the application isn't starting:

    ```sh
    kubectl describe pod lmw-leaf-68f4cc7f5d-gm79b
    ```

    ```terminal
    ...
    Warning  FailedScheduling  <unknown>  default-scheduler  0/3 nodes are available: 3 Insufficient cpu.
    ```

    The application has a resource requirement when being scheduled on a node and we don't have enough resources to run all pods.

    ```sh
    grep resources: -A2 deployment.yaml
    ```

    resource requests signify the minimum amount of resources this container requires to run. If it's not available, we'll need to add more nodes to the cluster.

    ```terminal
        resources:
          requests:
            cpu: 1000m
    ```

## Scale the Cluster

Node 4 to the rescue!

1. Fail to join the master:

    ```sh
        ssh k8-t<team>-n4
        sudo kubeadm join 192.168.10.140:6443 --token r3xyoq.t92yjpgsdrf0y7e4 \
            --discovery-token-ca-cert-hash sha256:0d919582cbce47e25a8ac22f7166c9633816475b8a87be749d62953c0ef492f0 -v=1
    ```

    That didn't work. The token has expired! stop waiting by pressing `ctrl+c`.

    ```terminal
    Failed to connect to API Server "192.168.10.140:6443": token id "krl4bq" is invalid for this cluster or it has expired. Use "kubeadm token create" on the control-plane node to create a new valid token
    ```

1. Create a new token:

    ```sh
    ssh k8-t<team>-n1
    sudo kubeadm token create --print-join-command --ttl 10m
    ```

1. Use the join command printed to join the node:

    ```terminal
    ssh k8-t<team>-n4
    sudo kubeadm join 192.168.40.107:6443 --token kh3pz3.s31hmgt9e31jdp0i     --discovery-token-ca-cert-hash sha256:e48ae4a31280d4057caf6ef60d86055c51ea0bf1619a006038d4f34ce5a21a95 -v1
    ```

1. Check that the node has joined, and wait for it to be in a `Ready` state:

    ```sh
    kubectl get nodes
    ```

1. Label the new node to schedule the blinkt pod, enabling the LEDs:

    ```sh
    kubectl label node k8-t<team>-n4 deviceType=blinkt
    ```

1. All of your pods should now be in `Running` state:

    ```sh
    kubectl get pods
    ```

### Services and Failure Zones

1. run a simple web application on the cluster:

    ```sh
    kubectl apply -f kubernetes-rocks.yaml
    ```

    The spec also exposes the the pods through a NodePort service which assigns a random unassigned port above 30000 on all nodes. In production environment you have a loadbalancer in front of the port.

1. Browse to the application

    ```sh
    kubectl get svc
    ```

    Check which port was assigned in the `PORT(S)` column. The application is listening on port 8000 and the mapped port is after the colon (:)

    ```terminal
    NAME               TYPE       CLUSTER-IP       EXTERNAL-IP   PORT(S)             AGE
    kubernetes-rocks   NodePort   10.105.251.110   <none>        8000:30631/TCP   11m
    ```

    In the above example, the service is assigned to port 30631, browsing to `http://k8-t<team>-n<node>:30631` should show the page.

    The port can also be fetched using JSONpath. The port

    ```sh
    kubectl get svc kubernetes-rocks -o jsonpath='{.spec.ports[?(@.name=="http")].nodePort}'
    ```

1. Label the nodes to see where the application is running:

    Node labels can also be used to inform applications where the service is running

    ```sh
    kubectl label node k8-t<team>-n1 failure-domain.beta.kubernetes.io/zone=k8-t<team>-n1
    kubectl label node k8-t<team>-n2 failure-domain.beta.kubernetes.io/zone=k8-t<team>-n2
    kubectl label node k8-t<team>-n3 failure-domain.beta.kubernetes.io/zone=k8-t<team>-n3
    kubectl label node k8-t<team>-n4 failure-domain.beta.kubernetes.io/zone=k8-t<team>-n4
    ```

    The application uses the kubernetes API to determine which failure zone it is running in. When we design kubernetes clusters we generally want multiple nodes in each failure zone, in the event of zone availability.

1. Reload the web page, the failure zone should be visible in the top right corner

### Ingress Controller

An ingress controller configures ingress resources that allow traffic into the cluster. Ingress resource the configure the controller to route traffic to services based on http path and/or host.

We'll use helm to deploy a well defined configuration for this application. Helm uses templating to generate and apply lots of yaml files in the cluster:

1. install helm

    ```sh
    curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash
    ```

1. Add the stable chart repo:

    This adds a repo uri and gives it the name stable.

    ```sh
    helm repo add stable https://kubernetes-charts.storage.googleapis.com/
    ```

1. Install an nginx based ingress controller:

    ```sh
    helm upgrade --install --force ingress-controller stable/nginx-ingress \
      --set controller.kind=DaemonSet \
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

    helm charts set *values* that are used in the templating of yaml files. In this example we set them on the command line directly, but normally this is provided in a values.yaml file and checked into version control.

    The above configuration sets the LED color to blue for the ingress-controller and purple for the the 404-service, also known as the default backend. Any requests that do not match a service in the ingress is sent to the default backend.

1. Configure the service to use the ingress

    ```sh
    kubectl apply -f kubernetes-rocks-ingress.yaml
    ```

1. Browse to the service through the ingress:

    browse to `http://k8s-t<team>-n<node>:30080` and `https://k8s-t<team>-n<node>:30443`.

    The nginx ingress controller provides a default self signed certificate for https. If you get a warning for self-signed certificate

### Chaos

Let's simulate some instabillity

1. Install a disruption testing service that kills services randomly. Services being killed will blink in red, services starting up will blink green.

    ```sh
    helm upgrade --install --force chaos stable/chaoskube \
    --set imageTag=v0.16.0-arm32v6 \
    --set namespaces=default \
    --set labels='app!=nginx-ingress' \
    --set dryRun=false \
    --set rbac.create=true \
    --set interval=1s
    ```

    **Note:** The label configuration prevents it from killing the nginx-ingress as it takes too long to start up.

1. Let's generate some load  through the the NodePort service:

    **Note:** If installing artillery as root `--ignore-scripts` might have to be appended to the command.

    ```sh
    npm install -g artillery
    artillery quick --count 10 -n 20 http://t<team>-n<node>:<port>
    ```

    or programatically

    ```sh
    npm install -g artillery
    NODEPORT=$(kubectl get svc kubernetes-rocks -o jsonpath='{.spec.ports[?(@.name=="http")].nodePort}')
    NODE=$(kubectl get nodes -o name | tail -1)
    artillery quick --count 10 -n 20 http://${NODE#*/}:${NODEPORT}
    ```

    All traffic should generate an ok (200) response:

    ```terminal
    ...
      Codes:
        200: 200
    ```

    Increase the load  by increasing number of calls `count` or the number of concurrent users `n`.

1. Let's generate some load  through the the ingress service:

    ```sh
    artillery quick --count 10 -n 20 http://t<team>-n<node>:30080
    artillery quick --count 10 -n 20 https//t<team>-n<node>:30443
    ```

### Maintenance

Time to patch the servers without service downtime

1. Cordon a randomly selected node to prevent new pods from being scheduled:

    ```sh
    kubectl cordon k8-t<team>-n1
    kubectl drain k8-t<team>-n1 --ignore-daemonsets --force
    ```

    `Cordon` prevents new loads from being scheduled on the node.

    `drain` cordons and evicts all workloads, moving them to other nodes.

1. Uncordon the node to allow workloads to be scheduled again.

    ```sh
    kubectl uncordon k8-t<team>-n1
    ```

### Affinity

Affinity and anti-affinity can control which pods are scheduled together. Let's separate some app pods from loadbalancer pods:

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

    As the yellow worker pods are killed på chaos kube they should be scheduled separate from the blue loadbalancer pods

1. Restart all the pods

    Pods are cattle and can be slaughtered indiscriminately as they will be restarted as soon as possible. This will however result in downtime, and setting grace period 0 may lead to etcd corruption and in not recommended in production.

    ```sh
    kubectl delete pods --all --force --grace-period=0
    ```

### Dashboard

The kubernetes dashboard provides simple metrics and a graphical management tool for kubernetes.

1. Apply the kubernetes-dashboard

    ```sh
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0-beta6/aio/deploy/recommended.yaml
    ```

1. make the service account cluster admin.

    The kubernetes dashboard can only do what the logged in user is allowed to. Setting the service account as cluster admin and logging in as that user allows for cluster wide access. This is not reocommended for production systems:

    ```sh
    kubectl create clusterrolebinding kubernetes-dashboard-admin-binding --clusterrole=cluster-admin --serviceaccount=kubernetes-dashboard:kubernetes-dashboard
    ```

1. Get the auth token:

    The kubernetes dashboard uses auth tokens to log in. The user or service account determines the level of access:

    ```sh
    kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | awk '/^kubernetes-dashboard-token-/{print $1}') | awk '$1=="token:"{print $2}'
    ```

    Copy the entire token from terminal as we'll require it shortly:

    ```terminal
    eyJhbGciOiJSUzI1NiIsImtpZCI6InhJb3RJNWxodklSUlRxbHVPUllZczgzSURxeXhYelRHVFhvNFFIRmoza2cifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJrdWJlcm5ldGVzLWRhc2hib2FyZC10b2tlbi05cDg0NSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50Lm5hbWUiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjYzYjIyNTlkLTg3NDUtNDg1ZC1iMjA2LWIzYWNiNDJiOWFkZSIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDprdWJlcm5ldGVzLWRhc2hib2FyZDprdWJlcm5ldGVzLWRhc2hib2FyZCJ9.ivR84ABsG6ikYxAkfet9HeTHP0zApTtscxmKG_a5waJ3tVejF0pUQpbf1TBdKPFr1rPvvMwlADCSBBWJ2moz3svsqUHUt6KGX0zAD-BqpQN9JjQYIscZgOUvACH9Q2QbP5GwQxUI-DOcBEEb_WdAXSpRyp4G4h-Nv_4CoEexMfvmUzlJnnzDGvLBaSL7Fh597AogY84dft9QOrb8bw1nbHPmcAMwPSuuqNAPPbMtiyYyOq_JfU5-bDzR1znEKbzj05dP0jqYQ-FHncQcJ2uMfoow50x0f557V_qSxPU-C-eBPudQ-TVhw3fOxq-xUpgRm9WvcRTyxMYhllafLcgMcA
    ```

1. Start the proxy server

    Since the service is not exposed through the any service, we can start a kubernetes API proxy to access the service:

    ```sh
    kubectl proxy
    ```

    browse to `http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/#/login`, select **Token** login and paste the token from the above command.

1. Accessing any service

    If you look closely at the above URI, you can replace the namespace, servicename and port to access any service:

    Replace
    * **namespace** with `default`
    * **protocol** from `https` to `http`
    * **port** add `3000`

    **Result:**

    `http://localhost:8001/api/v1/namespaces/default/services/http:lmw-leaf:3000/proxy/`

    You now see the output of the lmw-leaf service

From [source](https://hub.docker.com/r/kubernetesui/dashboard).

## Revenge of the Moles

The moles will no longer be repressed

1. Uninstall chaoskube

    Helm charts can easily be removed:

    ```sh
    helm delete chaos
    ```

    Your cluster should now be healthy

1. Reduce the cpu resource requests and increase the number of moles

```sh
kubectl patch deployment lmw-leaf --patch "
spec:
  replicas: 30
  template:
    spec:
      containers:
      - name: lmw-leaf
        resources:
          requests:
            cpu: 100m
"
```
