#!/bin/bash
set -e

DIR=$(realpath $(dirname ${BASH_SOURCE[0]}))
cd $DIR

echo ""

if [ $# -gt 1 -a "$1" == "push" ]
then
    TAG=$2
    echo "# Pushing Web ($TAG)"
    echo ""
    docker push bytegarden/web:$TAG
elif [ $# -gt 1 -a "$1" == "tag" ]
then
    TAG=$2
    echo "Tagging Web as '$TAG'"
    docker tag bytegarden/web bytegarden/web:$TAG
else
    echo "# Building Web"

    echo
    echo "Building app"
    yarn
    yarn dist

    echo
    echo "Building docker image"
    docker --version
    docker build -t bytegarden/web $DIR/.
fi
