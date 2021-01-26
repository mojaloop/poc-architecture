#!/bin/bash

let SIMULATORS=1

let PARTICIPANTS_CMD=1
let PARTICIPANTS_EVT=1

let TRANSFERS_SINGLE=2 # either start this or the evt+cmd handlers below
let TRANSFERS_CMD=0 #
let TRANSFERS_EVT=0 #

#let PARTICIPANTS_EVT=$PARTICIPANTS_CMD/2
#let TRANSFERS_CMD=$PARTICIPANTS_CMD*2
#let TRANSFERS_EVT=$PARTICIPANTS_EVT

##----------------------------------------------
##----------------------------------------------

docker-compose -f docker-compose-app.yml -p "arch_poc" up -d \
	--scale transfers_evt=$TRANSFERS_EVT \
	--scale transfers_cmd=$TRANSFERS_CMD \
	--scale participants_evt=$PARTICIPANTS_EVT \
	--scale participants_cmd=$PARTICIPANTS_CMD \
	--scale transfers_single=$TRANSFERS_SINGLE \
	--scale simulator=$SIMULATORS




