# Ansible Setup

This readme describes how to prepare raspberry pi clusters for this lab.

## Prerequisites

The raspberry pies must be configured with static IP adresses, either locally or by statically assigning the ip addresses in the DHCP server.

## Configuration

Configure the `hosts` file so the node names match up with the ip addresses

1. update the `[nodes:children]`section to reflect the number of clusters:

```sh
[nodes:children]
t1
t2
...
```

1. Add a section for each cluster:

```sh
[t1]
192.168.33.11 h=k8-t1-n1
192.168.33.12 h=k8-t1-n2
192.168.33.13 h=k8-t1-n3
192.168.33.14 h=k8-t1-n4
...
```

