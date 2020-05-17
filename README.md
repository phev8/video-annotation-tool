# Video Annotation Tool

* [Video Annotation Tool](https://github.com/phev8/video-annotation-tool.git) (this repository)

## Quickstart

### 0. Prerequisites:

* [git](https://git-scm.com/downloads) 
* [Docker](https://docs.docker.com/install/)
* [Docker Compose](https://docs.docker.com/compose/install/)

Additionally if the installation is occurring in a windows system, ensure that git checks out files with unix style endings by running the following:

```bash
$ git config --global core.autocrlf false
```


### 0. Dependencies

* [Video Analyzer](https://github.com/sajeeth1009/video_analyzer.git)

NOTE: This service is used by the Video Annotation tool to perform the tasks of object tracking as well as
the generation of recommendations. Follow the instructions for the installations by clcking on the link above. 

Complete the installation for this before proceeding further.

### 1. Clone the repository

This repository serves as a parent module for our client and server implementation. 
```bash
$ git clone -b extended-video-annotation https://github.com/phev8/video-annotation-tool.git
```

### 2. Edit .env

Change `SAT_HOSTNAME` entry in the `.env` to the IP of the docker daemon.
This can be obtained by running the command 
```bash
docker run --net=host codenvy/che-ip
```

You can open the environment file to update the field `SAT_HOSTNAME` to the correct IP. Additionally also set up the IP of the 
daemon that is running the Video Analyzer service by specifying it in the field `VIDEO_SERVICE_HOSTNAME`
```bash
$ cd video-annotation-tool
$ nano .env
```

For example:
```dotenv
SAT_HOSTNAME=172.17.0.1
VIDEO_SERVICE_HOSTNAME=172.17.0.1
VIDEO_SERVICE_PORT=5000
```


### 3. Pull containers and bring them up (launch):

```bash
$ cd video-annotation-tool
$ (sudo) docker-compose up --build
```
This process will take some time and will install the required node modules and will build a running mongodb instance, a backend tier and a front-end tier.

When the process is finished, open your browser and go to  `<docker-host-ip>:4200`

## Initial Set-up

Kindly refer to the getting-started.doc for a walk-through on getting started and creating a project for labelling.



## Troubleshooting

###  Stop and remove containers, networks and volumes

WARNING: This will clear any data you had in your mongodb instance. If you wish to save persistent data, try this link 
(TODO: add a link describing how to backup docker volumes)

If you had a previous version running in your system you might want to remove previous containers, networks and volumes. 

```bash
$ docker-compose down
```
Lastly, the entire system can be deleted for re-creation using the command
```bash
$ docker system prune --all
```

---

NOTE: The containers will attempt to use port 27017 for Mongo, port 4200 for the Frontend and port 3000 for the Backend. Depending on your system you might want to change these values in `docker-compose.yaml`.
