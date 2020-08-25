#!/bin/sh

while [ ! -f t1.yml -o ! -f t2.yml -o ! -f t3.yml -o ! -f t4.yml -o ! -f t5.yml ]; do
  for n in `seq 1 5`; do
    if [ ! -f t$n.yml ]; then
      sshpass -p "raspberry" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=4 pi@192.168.33.${n}1:~/.kube/config ./t$n.yml
    fi
  done
  sleep 10
done