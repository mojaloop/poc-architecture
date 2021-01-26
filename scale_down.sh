#!/usr/bin/bash

docker-compose -f docker-compose-app.yml -p "arch_poc" up -d \
	--scale transfers_evt=0 \
	--scale transfers_cmd=0 \
	--scale transfers_single=0 \
	--scale participants_evt=0 \
	--scale participants_cmd=0 \
  --scale simulator=0
