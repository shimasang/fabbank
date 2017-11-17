# Copyright (C) 2017 Yoshihide Shimada <yoshihide.shimada@ieee.org>
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
# 	http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

echo "fabbank start..."

function clearContainers () {
  CONTAINER_IDS=$(docker ps -aq)
  if [ -z "$CONTAINER_IDS" -o "$CONTAINER_IDS" == " " ]; then
    echo "---- No containers available for deletion ----"
  else
    docker rm -f $CONTAINER_IDS
  fi
}

function removeUnwantedImages() {
  DOCKER_IMAGE_IDS=$(docker images | grep "net_bank-" | awk '{print $3}')
  if [ -z "$DOCKER_IMAGE_IDS" -o "$DOCKER_IMAGE_IDS" == " " ]; then
    echo "---- No images available for deletion ----"
  else
    docker rmi -f $DOCKER_IMAGE_IDS
  fi
}

function upNetwork () {
	COMPOSE_PROJECT_NAME=net TIMEOUT=$CLI_TIMEOUT DELAY=$CLI_DELAY docker-compose -f $COMPOSE_FILE up -d 2>&1
}

function downNetwork () {
	COMPOSE_PROJECT_NAME=net docker-compose -f $COMPOSE_FILE down
}

# timeout duration - the duration the CLI should wait for a response from
# another container before giving up
CLI_TIMEOUT=10000
#default for delay
CLI_DELAY=3
# use this as the default docker-compose yaml definition
COMPOSE_FILE=./docker-compose-cli.yaml

while getopts "h?m:c:t:d:f:s:" opt; do
  case "$opt" in
    h|\?)
      printHelp
      exit 0
    ;;
    m)  MODE=$OPTARG
    ;;
    c)  CHANNEL_NAME=$OPTARG
    ;;
    t)  CLI_TIMEOUT=$OPTARG
    ;;
    d)  CLI_DELAY=$OPTARG
    ;;
    f)  COMPOSE_FILE=$OPTARG
    ;;
    s)  IF_COUCHDB=$OPTARG
    ;;
  esac
done

if [ "${MODE}" == "up" ]; then
	upNetwork

	elif [ "$MODE" == "down" ]; then
		downNetwork
    removeUnwantedImages
fi